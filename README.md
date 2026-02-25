# Three Jars — Family Finance Tracker 🏦

A family finance app that teaches kids saving, spending, and giving habits
using the classic 3-jar system. Built with Next.js, Supabase, and Tailwind CSS.

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works fine)

### 1. Clone & Install

```bash
cd three-jars
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of
   `supabase/migrations/001_initial_schema.sql`
3. Copy your API credentials from **Settings → API**

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your values:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API Keys → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase → Settings → API Keys → publishable key (`sb_publishable_...`) |
| `SUPABASE_SECRET_DEFAULT_KEY` | Supabase → Settings → API Keys → secret key (`sb_secret_...`) |
| `KID_SESSION_SECRET` | Generate with: `openssl rand -base64 32` |

### 4. Seed Demo Data (Optional)

```bash
npm run seed
```

This creates:
- Parent: `parent@example.com` / `password123`
- Kids: Maya (PIN: 1234), Leo (PIN: 5678)
- Sample transactions and savings goals

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Set the same environment variables in your Vercel project settings.

## PWA Icons

Add 192×192 and 512×512 PNG icons to `public/icons/`:
- `icon-192.png`
- `icon-512.png`

You can generate these from any emoji-to-PNG tool using 🏦.

## Architecture

```
app/
  login/           → Parent email/password auth (Supabase Auth)
  kid-login/       → Kid avatar grid + PIN entry
  parent/          → Dashboard, kid management, transactions
  kid/[kidId]/     → Kid read-only dashboard with jar cards
lib/
  supabase/        → Server + client + admin Supabase instances
  auth/            → Parent session + kid JWT session helpers
  actions/         → All Server Actions (mutations)
  money.ts         → Cent-based money utilities (no floating point)
types/
  db.ts            → Typed database models
```

## Key Design Decisions

- **All money in integer cents** — no floating point math, ever
- **Earn splits**: `spend = floor(amount × spend% / 100)`,
  `giving = floor(amount × giving% / 100)`, `savings = amount - spend - giving`
- **Transactions are never deleted** — voiding creates a reversal record
- **Atomic mutations** via Postgres RPC functions (SECURITY DEFINER)
- **Kid auth** uses signed JWT in HttpOnly cookie (4h expiry), not Supabase Auth
- **RLS** enforces data isolation; parent_id always derived server-side

## Testing

```bash
npm test
```

Tests cover:
- Earn split calculations (standard, remainder, non-round percentages)
- Dollar/cent conversions
- Void reversal amount correctness
- Insufficient balance detection

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Supabase (Postgres + Auth)
- bcryptjs (PIN hashing)
- jose (JWT signing)
- Vitest (testing)
