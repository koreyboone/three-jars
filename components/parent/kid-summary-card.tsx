// components/parent/kid-summary-card.tsx
import Link from 'next/link'
import { centsToDisplay } from '@/lib/money'
import type { Kid, Jar } from '@/types/db'

interface KidSummaryCardProps {
  kid: Kid
  jars: Jar[]
}

export default function KidSummaryCard({ kid, jars }: KidSummaryCardProps) {
  const savings = jars.find((j) => j.type === 'savings')?.balance_cents ?? 0
  const spend = jars.find((j) => j.type === 'spend')?.balance_cents ?? 0
  const giving = jars.find((j) => j.type === 'giving')?.balance_cents ?? 0
  const total = savings + spend + giving

  return (
    <Link
      href={`/parent/kids/${kid.id}`}
      className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-slate-100"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{kid.avatar_emoji}</span>
        <div>
          <h3 className="text-lg font-bold text-navy">{kid.name}</h3>
          <p className="text-sm text-slate-500">
            Total: <span className="font-semibold">{centsToDisplay(total)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-savings/10 rounded-lg p-2">
          <p className="text-xs text-savings font-medium">💰 Savings</p>
          <p className="text-sm font-bold text-savings">
            {centsToDisplay(savings)}
          </p>
        </div>
        <div className="bg-spend/10 rounded-lg p-2">
          <p className="text-xs text-spend font-medium">🛍️ Spend</p>
          <p className="text-sm font-bold text-spend">
            {centsToDisplay(spend)}
          </p>
        </div>
        <div className="bg-giving/10 rounded-lg p-2">
          <p className="text-xs text-giving font-medium">❤️ Giving</p>
          <p className="text-sm font-bold text-giving">
            {centsToDisplay(giving)}
          </p>
        </div>
      </div>
    </Link>
  )
}
