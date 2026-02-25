// components/kid/jar-card.tsx
'use client'

import CountUp from '@/components/shared/count-up'
import type { JarType } from '@/types/db'

const JAR_CONFIG: Record<
  JarType,
  { emoji: string; label: string; bg: string; text: string; accent: string }
> = {
  savings: {
    emoji: '💰',
    label: 'Savings',
    bg: 'bg-savings',
    text: 'text-white',
    accent: 'bg-savings-accent',
  },
  spend: {
    emoji: '🛍️',
    label: 'Spend',
    bg: 'bg-spend',
    text: 'text-white',
    accent: 'bg-spend-accent',
  },
  giving: {
    emoji: '❤️',
    label: 'Giving',
    bg: 'bg-giving',
    text: 'text-white',
    accent: 'bg-giving-accent',
  },
}

interface JarCardProps {
  type: JarType
  balanceCents: number
}

export default function JarCard({ type, balanceCents }: JarCardProps) {
  const config = JAR_CONFIG[type]

  return (
    <div
      className={`${config.bg} ${config.text} rounded-2xl p-6 shadow-lg`}
    >
      <div className="text-6xl mb-2" aria-hidden="true">
        {config.emoji}
      </div>
      <h3 className="text-kid-jar font-bold font-display mb-1">
        {config.label}
      </h3>
      <CountUp
        target={balanceCents}
        className="text-kid-balance font-extrabold font-display tracking-tight"
        formatFn={(n) => `$${(n / 100).toFixed(2)}`}
      />
    </div>
  )
}
