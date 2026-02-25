// app/kid/[kidId]/dashboard/page.tsx
import { requireKidSession } from '@/lib/auth/kid'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import JarCard from '@/components/kid/jar-card'
import Thermometer from '@/components/shared/thermometer'
import RecentTransactions from '@/components/kid/recent-transactions'
import MilestoneCelebration from '@/components/kid/milestone-celebration'
import KidLogoutButton from './logout-button'
import type { Jar, SavingsGoal, Transaction } from '@/types/db'

export async function generateMetadata() {
  return { title: 'My Jars — Three Jars' }
}

export default async function KidDashboardPage({
  params,
}: {
  params: Promise<{ kidId: string }>
}) {
  const { kidId } = await params
  const kidSession = await requireKidSession(kidId)

  // Use admin client — kid has no Supabase Auth session
  const admin = createAdminClient()

  const [
    { data: jars },
    { data: goal },
    { data: transactions },
    { data: kid },
  ] = await Promise.all([
    admin.from('jars').select('*').eq('kid_id', kidId),
    admin
      .from('savings_goals')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('transactions')
      .select('*')
      .eq('kid_id', kidId)
      .order('created_at', { ascending: false })
      .limit(10),
    admin
      .from('kids')
      .select('name, avatar_emoji')
      .eq('id', kidId)
      .single(),
  ])

  if (!kid) redirect('/kid-login')

  const jarList = (jars ?? []) as Jar[]
  const savingsJar = jarList.find((j) => j.type === 'savings')
  const spendJar = jarList.find((j) => j.type === 'spend')
  const givingJar = jarList.find((j) => j.type === 'giving')
  const savingsGoal = goal as SavingsGoal | null

  const savingsBalance = savingsJar?.balance_cents ?? 0
  const currentPercent =
    savingsGoal && savingsGoal.target_amount_cents > 0
      ? Math.round((savingsBalance / savingsGoal.target_amount_cents) * 100)
      : 0

  return (
    <main className="min-h-screen bg-gradient-to-b from-savings/5 to-savings-accent/10 pb-12">
      {/* Header */}
      <header className="bg-savings text-white py-6 px-4 rounded-b-3xl shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{kid.avatar_emoji}</span>
            <div>
              <p className="text-savings-accent text-sm font-medium">Welcome back,</p>
              <h1 className="text-2xl font-extrabold font-display">
                {kid.name}!
              </h1>
            </div>
          </div>
          <KidLogoutButton />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Milestone celebration */}
        {savingsGoal && (
          <MilestoneCelebration
            goalId={savingsGoal.id}
            currentPercent={currentPercent}
            lastCelebratedPercent={savingsGoal.last_celebrated_percent}
          />
        )}

        {/* Jar cards */}
        <div className="space-y-4">
          {savingsJar && (
            <JarCard type="savings" balanceCents={savingsJar.balance_cents} />
          )}
          {spendJar && (
            <JarCard type="spend" balanceCents={spendJar.balance_cents} />
          )}
          {givingJar && (
            <JarCard type="giving" balanceCents={givingJar.balance_cents} />
          )}
        </div>

        {/* Savings thermometer */}
        {savingsGoal && (
          <div className="bg-white rounded-2xl p-5 shadow-md">
            <Thermometer
              currentCents={savingsBalance}
              targetCents={savingsGoal.target_amount_cents}
              label={savingsGoal.label}
            />
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <h2 className="text-xl font-bold font-display text-navy mb-3">
            Recent Activity
          </h2>
          <RecentTransactions
            transactions={(transactions ?? []) as Transaction[]}
          />
        </div>
      </div>
    </main>
  )
}
