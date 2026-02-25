// app/parent/kids/[kidId]/settings/page.tsx
import { requireParentSession } from '@/lib/auth/parent'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import JarSettingsForm from '@/components/parent/jar-settings-form'
import SavingsGoalForm from '@/components/parent/savings-goal-form'
import ResetPinForm from '@/components/parent/reset-pin-form'
import BalanceAdjustmentForm from '@/components/parent/balance-adjustment-form'
import type { Kid, Jar, JarSettings, SavingsGoal } from '@/types/db'

export async function generateMetadata() {
  return { title: 'Kid Settings — Three Jars' }
}

export default async function KidSettingsPage({
  params,
}: {
  params: Promise<{ kidId: string }>
}) {
  const { kidId } = await params
  const user = await requireParentSession()
  const supabase = await createClient()

  const { data: kid } = await supabase
    .from('kids')
    .select('*')
    .eq('id', kidId)
    .eq('parent_id', user.id)
    .single()

  if (!kid) redirect('/parent/dashboard')

  const [{ data: settings }, { data: goal }, { data: jars }] = await Promise.all([
    supabase.from('jar_settings').select('*').eq('kid_id', kidId).single(),
    supabase
      .from('savings_goals')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('jars').select('*').eq('kid_id', kidId),
  ])

  const jarList = (jars ?? []) as Jar[]
  const savingsBalance = jarList.find((j) => j.type === 'savings')?.balance_cents ?? 0
  const spendBalance = jarList.find((j) => j.type === 'spend')?.balance_cents ?? 0
  const givingBalance = jarList.find((j) => j.type === 'giving')?.balance_cents ?? 0

  return (
    <div>
      <Link
        href={`/parent/kids/${kidId}`}
        className="text-sm text-slate-400 hover:text-slate-600 mb-4 inline-block"
      >
        ← Back to {(kid as Kid).name}
      </Link>

      <h1 className="text-2xl font-bold text-navy mb-6">
        ⚙️ Settings for {(kid as Kid).name}
      </h1>

      <div className="space-y-6">
        {settings && (
          <JarSettingsForm
            kidId={kidId}
            settings={settings as JarSettings}
          />
        )}
        <BalanceAdjustmentForm
          kidId={kidId}
          kidName={(kid as Kid).name}
          currentSavings={savingsBalance}
          currentSpend={spendBalance}
          currentGiving={givingBalance}
        />
        <SavingsGoalForm
          kidId={kidId}
          existingGoal={goal as SavingsGoal | null}
        />
        <ResetPinForm kidId={kidId} />
      </div>
    </div>
  )
}
