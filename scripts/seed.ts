// scripts/seed.ts
// Run with: npx tsx scripts/seed.ts
// Seeds a demo parent + kid for local development.

import { createClient } from '@supabase/supabase-js'
import { hash } from 'bcryptjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SECRET_KEY = process.env.SUPABASE_SECRET_DEFAULT_KEY!

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_DEFAULT_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log('🌱 Seeding database...\n')

  // 1. Create parent user via Supabase Auth
  const email = 'parent@example.com'
  const password = 'password123'

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authErr) {
    if (authErr.message.includes('already been registered')) {
      console.log('Parent user already exists, skipping auth creation.')
    } else {
      throw authErr
    }
  } else {
    console.log(`✓ Created parent user: ${email}`)
  }

  // Get the user ID
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const parent = users.find((u) => u.email === email)
  if (!parent) throw new Error('Could not find parent user')

  const parentId = parent.id

  // 2. Create two kids
  const kids = [
    { name: 'Maya', avatar_emoji: '🦊', pin: '1234' },
    { name: 'Leo', avatar_emoji: '🦁', pin: '5678' },
  ]

  for (const kidData of kids) {
    const pinHash = await hash(kidData.pin, 10)

    const { data: kidId, error: kidErr } = await supabase.rpc(
      'create_kid_with_jars',
      {
        p_parent_id: parentId,
        p_name: kidData.name,
        p_avatar_emoji: kidData.avatar_emoji,
        p_pin_hash: pinHash,
      }
    )

    if (kidErr) {
      console.log(`  ⚠ Kid ${kidData.name}: ${kidErr.message}`)
      continue
    }

    console.log(
      `✓ Created kid: ${kidData.name} (PIN: ${kidData.pin}, ID: ${kidId})`
    )

    // Add some sample transactions
    const { data: settings } = await supabase
      .from('jar_settings')
      .select('*')
      .eq('kid_id', kidId)
      .single()

    if (settings) {
      // Earn $20
      const earnCents = 2000
      const spendCents = Math.floor(
        (earnCents * settings.spend_percent) / 100
      )
      const givingCents = Math.floor(
        (earnCents * settings.giving_percent) / 100
      )
      const savingsCents = earnCents - spendCents - givingCents

      await supabase.rpc('process_earn_transaction', {
        p_kid_id: kidId,
        p_amount_cents: earnCents,
        p_description: 'Allowance for the week',
        p_savings_cents: savingsCents,
        p_spend_cents: spendCents,
        p_giving_cents: givingCents,
        p_split_snapshot: {
          savings_percent: settings.savings_percent,
          spend_percent: settings.spend_percent,
          giving_percent: settings.giving_percent,
        },
      })
      console.log(`  ✓ Added $20 earning for ${kidData.name}`)

      // Earn $15
      const earn2 = 1500
      const spend2 = Math.floor((earn2 * settings.spend_percent) / 100)
      const giving2 = Math.floor((earn2 * settings.giving_percent) / 100)
      const savings2 = earn2 - spend2 - giving2

      await supabase.rpc('process_earn_transaction', {
        p_kid_id: kidId,
        p_amount_cents: earn2,
        p_description: 'Helped wash the car',
        p_savings_cents: savings2,
        p_spend_cents: spend2,
        p_giving_cents: giving2,
        p_split_snapshot: {
          savings_percent: settings.savings_percent,
          spend_percent: settings.spend_percent,
          giving_percent: settings.giving_percent,
        },
      })
      console.log(`  ✓ Added $15 earning for ${kidData.name}`)

      // Spend $3 from spend jar
      await supabase.rpc('process_withdraw_transaction', {
        p_kid_id: kidId,
        p_type: 'spend',
        p_amount_cents: 300,
        p_description: 'Bought a comic book',
        p_jar_target: 'spend',
      })
      console.log(`  ✓ Added $3 spend for ${kidData.name}`)

      // Set a savings goal
      await supabase.from('savings_goals').insert({
        kid_id: kidId,
        label: kidData.name === 'Maya' ? 'New Lego Set' : 'Soccer Ball',
        target_amount_cents: 5000,
      })
      console.log(`  ✓ Set savings goal for ${kidData.name}`)
    }
  }

  console.log('\n🎉 Seed complete!')
  console.log(`\nLogin with: ${email} / ${password}`)
  console.log('Kid PINs: Maya=1234, Leo=5678')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
