-- ============================================================
-- Three Jars — Family Finance Tracker
-- Initial schema migration
-- ============================================================

-- 1. TABLES
-- -----------------------------------------------------------

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'parent' CHECK (role = 'parent'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.kids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '😊',
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.jars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('savings', 'spend', 'giving')),
  balance_cents integer NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  UNIQUE(kid_id, type)
);

CREATE TABLE public.jar_settings (
  kid_id uuid PRIMARY KEY REFERENCES public.kids(id) ON DELETE CASCADE,
  savings_percent integer NOT NULL DEFAULT 70,
  spend_percent integer NOT NULL DEFAULT 20,
  giving_percent integer NOT NULL DEFAULT 10,
  CONSTRAINT chk_percents_sum_100
    CHECK (savings_percent + spend_percent + giving_percent = 100),
  CONSTRAINT chk_percents_positive
    CHECK (savings_percent >= 0 AND spend_percent >= 0 AND giving_percent >= 0)
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn', 'spend', 'give')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  description text NOT NULL,
  savings_amount_cents integer,
  spend_amount_cents integer DEFAULT 0,
  giving_amount_cents integer DEFAULT 0,
  split_snapshot jsonb,
  jar_target text CHECK (jar_target IN ('savings', 'spend', 'giving')),
  voided boolean NOT NULL DEFAULT false,
  voided_at timestamptz,
  voided_transaction_id uuid REFERENCES public.transactions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  label text NOT NULL,
  target_amount_cents integer NOT NULL CHECK (target_amount_cents > 0),
  last_celebrated_percent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_kids_parent ON public.kids(parent_id);
CREATE INDEX idx_jars_kid ON public.jars(kid_id);
CREATE INDEX idx_transactions_kid ON public.transactions(kid_id);
CREATE INDEX idx_transactions_kid_created ON public.transactions(kid_id, created_at DESC);
CREATE INDEX idx_savings_goals_kid ON public.savings_goals(kid_id);


-- 2. ROW LEVEL SECURITY
-- -----------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- kids
CREATE POLICY "kids_select_own" ON public.kids
  FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "kids_insert_own" ON public.kids
  FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "kids_update_own" ON public.kids
  FOR UPDATE USING (parent_id = auth.uid());
CREATE POLICY "kids_delete_own" ON public.kids
  FOR DELETE USING (parent_id = auth.uid());

-- jars
CREATE POLICY "jars_select_own" ON public.jars
  FOR SELECT USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "jars_insert_own" ON public.jars
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "jars_update_own" ON public.jars
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );

-- jar_settings
CREATE POLICY "jar_settings_select_own" ON public.jar_settings
  FOR SELECT USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "jar_settings_insert_own" ON public.jar_settings
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "jar_settings_update_own" ON public.jar_settings
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );

-- transactions
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "transactions_insert_own" ON public.transactions
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "transactions_update_own" ON public.transactions
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );

-- savings_goals
CREATE POLICY "savings_goals_select_own" ON public.savings_goals
  FOR SELECT USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "savings_goals_insert_own" ON public.savings_goals
  FOR INSERT WITH CHECK (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "savings_goals_update_own" ON public.savings_goals
  FOR UPDATE USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );
CREATE POLICY "savings_goals_delete_own" ON public.savings_goals
  FOR DELETE USING (
    kid_id IN (SELECT id FROM public.kids WHERE parent_id = auth.uid())
  );


-- 3. RPC FUNCTIONS (SECURITY DEFINER — atomic transactions)
-- -----------------------------------------------------------

-- Create kid with jars + jar_settings atomically
CREATE OR REPLACE FUNCTION public.create_kid_with_jars(
  p_parent_id uuid,
  p_name text,
  p_avatar_emoji text,
  p_pin_hash text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kid_id uuid;
BEGIN
  IF p_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO kids (parent_id, name, avatar_emoji, pin_hash)
  VALUES (p_parent_id, p_name, p_avatar_emoji, p_pin_hash)
  RETURNING id INTO v_kid_id;

  INSERT INTO jars (kid_id, type) VALUES
    (v_kid_id, 'savings'),
    (v_kid_id, 'spend'),
    (v_kid_id, 'giving');

  INSERT INTO jar_settings (kid_id) VALUES (v_kid_id);

  RETURN v_kid_id;
END;
$$;

-- Process an earn transaction: auto-split + update 3 jar balances
CREATE OR REPLACE FUNCTION public.process_earn_transaction(
  p_kid_id uuid,
  p_amount_cents integer,
  p_description text,
  p_savings_cents integer,
  p_spend_cents integer,
  p_giving_cents integer,
  p_split_snapshot jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_id uuid;
  v_parent_id uuid;
BEGIN
  SELECT parent_id INTO v_parent_id FROM kids WHERE id = p_kid_id;
  IF v_parent_id IS NULL OR v_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_savings_cents + p_spend_cents + p_giving_cents != p_amount_cents THEN
    RAISE EXCEPTION 'Split amounts must sum to total amount';
  END IF;

  INSERT INTO transactions (
    kid_id, type, amount_cents, description,
    savings_amount_cents, spend_amount_cents, giving_amount_cents,
    split_snapshot
  ) VALUES (
    p_kid_id, 'earn', p_amount_cents, p_description,
    p_savings_cents, p_spend_cents, p_giving_cents,
    p_split_snapshot
  ) RETURNING id INTO v_tx_id;

  UPDATE jars SET balance_cents = balance_cents + p_savings_cents
    WHERE kid_id = p_kid_id AND type = 'savings';
  UPDATE jars SET balance_cents = balance_cents + p_spend_cents
    WHERE kid_id = p_kid_id AND type = 'spend';
  UPDATE jars SET balance_cents = balance_cents + p_giving_cents
    WHERE kid_id = p_kid_id AND type = 'giving';

  RETURN v_tx_id;
END;
$$;

-- Process a spend/give withdrawal
CREATE OR REPLACE FUNCTION public.process_withdraw_transaction(
  p_kid_id uuid,
  p_type text,
  p_amount_cents integer,
  p_description text,
  p_jar_target text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_id uuid;
  v_parent_id uuid;
  v_balance integer;
BEGIN
  SELECT parent_id INTO v_parent_id FROM kids WHERE id = p_kid_id;
  IF v_parent_id IS NULL OR v_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_type NOT IN ('spend', 'give') THEN
    RAISE EXCEPTION 'Invalid transaction type for withdrawal';
  END IF;

  IF p_jar_target NOT IN ('spend', 'giving') THEN
    RAISE EXCEPTION 'Can only withdraw from spend or giving jars';
  END IF;

  SELECT balance_cents INTO v_balance
    FROM jars WHERE kid_id = p_kid_id AND type = p_jar_target
    FOR UPDATE;

  IF v_balance < p_amount_cents THEN
    RAISE EXCEPTION 'Insufficient balance in % jar', p_jar_target;
  END IF;

  INSERT INTO transactions (
    kid_id, type, amount_cents, description,
    spend_amount_cents, giving_amount_cents, jar_target
  ) VALUES (
    p_kid_id, p_type, p_amount_cents, p_description,
    CASE WHEN p_jar_target = 'spend' THEN -p_amount_cents ELSE 0 END,
    CASE WHEN p_jar_target = 'giving' THEN -p_amount_cents ELSE 0 END,
    p_jar_target
  ) RETURNING id INTO v_tx_id;

  UPDATE jars SET balance_cents = balance_cents - p_amount_cents
    WHERE kid_id = p_kid_id AND type = p_jar_target;

  RETURN v_tx_id;
END;
$$;

-- Void a transaction: mark original voided, create reversal, restore balances
CREATE OR REPLACE FUNCTION public.void_transaction(p_transaction_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
  v_parent_id uuid;
  v_reversal_id uuid;
BEGIN
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id AND voided = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or already voided';
  END IF;

  -- Also skip reversal rows — they cannot be voided
  IF v_tx.voided_transaction_id IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot void a reversal transaction';
  END IF;

  SELECT parent_id INTO v_parent_id FROM kids WHERE id = v_tx.kid_id;
  IF v_parent_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Mark original as voided
  UPDATE transactions SET voided = true, voided_at = now()
    WHERE id = p_transaction_id;

  IF v_tx.type = 'earn' THEN
    -- Check each jar has sufficient balance to reverse
    IF (SELECT balance_cents FROM jars
        WHERE kid_id = v_tx.kid_id AND type = 'savings' FOR UPDATE)
        < COALESCE(v_tx.savings_amount_cents, 0) THEN
      RAISE EXCEPTION 'Cannot void: insufficient savings balance';
    END IF;
    IF (SELECT balance_cents FROM jars
        WHERE kid_id = v_tx.kid_id AND type = 'spend' FOR UPDATE)
        < COALESCE(v_tx.spend_amount_cents, 0) THEN
      RAISE EXCEPTION 'Cannot void: insufficient spend balance';
    END IF;
    IF (SELECT balance_cents FROM jars
        WHERE kid_id = v_tx.kid_id AND type = 'giving' FOR UPDATE)
        < COALESCE(v_tx.giving_amount_cents, 0) THEN
      RAISE EXCEPTION 'Cannot void: insufficient giving balance';
    END IF;

    INSERT INTO transactions (
      kid_id, type, amount_cents, description,
      savings_amount_cents, spend_amount_cents, giving_amount_cents,
      voided_transaction_id
    ) VALUES (
      v_tx.kid_id, 'earn', v_tx.amount_cents,
      'Void: ' || v_tx.description,
      -COALESCE(v_tx.savings_amount_cents, 0),
      -COALESCE(v_tx.spend_amount_cents, 0),
      -COALESCE(v_tx.giving_amount_cents, 0),
      p_transaction_id
    ) RETURNING id INTO v_reversal_id;

    UPDATE jars SET balance_cents = balance_cents - COALESCE(v_tx.savings_amount_cents, 0)
      WHERE kid_id = v_tx.kid_id AND type = 'savings';
    UPDATE jars SET balance_cents = balance_cents - COALESCE(v_tx.spend_amount_cents, 0)
      WHERE kid_id = v_tx.kid_id AND type = 'spend';
    UPDATE jars SET balance_cents = balance_cents - COALESCE(v_tx.giving_amount_cents, 0)
      WHERE kid_id = v_tx.kid_id AND type = 'giving';

  ELSE
    -- spend or give — restore to the target jar
    INSERT INTO transactions (
      kid_id, type, amount_cents, description,
      spend_amount_cents, giving_amount_cents,
      jar_target, voided_transaction_id
    ) VALUES (
      v_tx.kid_id, v_tx.type, v_tx.amount_cents,
      'Void: ' || v_tx.description,
      CASE WHEN v_tx.jar_target = 'spend' THEN v_tx.amount_cents ELSE 0 END,
      CASE WHEN v_tx.jar_target = 'giving' THEN v_tx.amount_cents ELSE 0 END,
      v_tx.jar_target, p_transaction_id
    ) RETURNING id INTO v_reversal_id;

    UPDATE jars SET balance_cents = balance_cents + v_tx.amount_cents
      WHERE kid_id = v_tx.kid_id AND type = v_tx.jar_target;
  END IF;

  RETURN v_reversal_id;
END;
$$;

-- Allow Supabase auth trigger to create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
