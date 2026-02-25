// lib/supabase/admin.ts
// Secret-key client — bypasses RLS. Used only for kid-session operations
// where Supabase Auth is not available (custom PIN auth).
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_DEFAULT_KEY!
  )
}
