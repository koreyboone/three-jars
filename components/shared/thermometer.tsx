// components/shared/thermometer.tsx
'use client'

import { useEffect, useState } from 'react'
import { centsToDisplay } from '@/lib/money'

interface ThermometerProps {
  currentCents: number
  targetCents: number
  label: string
}

export default function Thermometer({
  currentCents,
  targetCents,
  label,
}: ThermometerProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0)
  const percent = Math.min(
    Math.round((currentCents / targetCents) * 100),
    100
  )

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) {
      setAnimatedPercent(percent)
      return
    }
    const timer = setTimeout(() => setAnimatedPercent(percent), 100)
    return () => clearTimeout(timer)
  }, [percent])

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-lg font-bold text-savings">🎯 {label}</span>
        <span className="text-sm font-medium text-slate-600">
          {centsToDisplay(currentCents)} / {centsToDisplay(targetCents)}
        </span>
      </div>

      <div
        className="w-full h-8 bg-gray-200 rounded-full overflow-hidden relative"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Savings goal: ${percent}% of ${centsToDisplay(targetCents)}`}
      >
        <div
          className="h-full bg-gradient-to-r from-savings to-savings-accent rounded-full transition-all duration-[800ms] ease-out flex items-center justify-end pr-2"
          style={{ width: `${Math.max(animatedPercent, 3)}%` }}
        >
          {animatedPercent >= 15 && (
            <span className="text-xs font-bold text-white drop-shadow">
              {animatedPercent}%
            </span>
          )}
        </div>
        {animatedPercent < 15 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
            {animatedPercent}%
          </span>
        )}
      </div>
    </div>
  )
}
