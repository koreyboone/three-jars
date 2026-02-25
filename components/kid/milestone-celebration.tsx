// components/kid/milestone-celebration.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Confetti from '@/components/shared/confetti'
import { updateCelebratedPercent } from '@/lib/actions/goals'

const THRESHOLDS = [25, 50, 75, 100] as const
const MESSAGES: Record<number, string> = {
  25: "You're a quarter of the way there! 🎉",
  50: 'Halfway! Keep going! 🚀',
  75: 'Almost there! 💪',
  100: 'You did it! Goal reached! 🏆',
}

interface MilestoneCelebrationProps {
  goalId: string
  currentPercent: number
  lastCelebratedPercent: number
}

export default function MilestoneCelebration({
  goalId,
  currentPercent,
  lastCelebratedPercent,
}: MilestoneCelebrationProps) {
  const [celebrating, setCelebrating] = useState(false)
  const [message, setMessage] = useState('')
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    // Find the highest threshold that was just crossed
    let crossedThreshold: number | null = null
    for (const t of THRESHOLDS) {
      if (t <= currentPercent && t > lastCelebratedPercent) {
        crossedThreshold = t
      }
    }

    if (crossedThreshold !== null) {
      setMessage(MESSAGES[crossedThreshold])
      setCelebrating(true)

      // Immediately persist so it won't replay
      updateCelebratedPercent(goalId, crossedThreshold)
    }
  }, [goalId, currentPercent, lastCelebratedPercent])

  const handleConfettiComplete = useCallback(() => {
    // Keep the message visible a bit longer
    setTimeout(() => setCelebrating(false), 2000)
  }, [])

  if (!celebrating) return null

  return (
    <>
      <Confetti onComplete={handleConfettiComplete} />
      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-2xl text-center max-w-sm mx-4 animate-bounce-in">
          <p className="text-2xl font-extrabold text-savings font-display">
            {message}
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-in {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}
