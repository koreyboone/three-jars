// components/shared/confetti.tsx
'use client'

import { useEffect, useState } from 'react'

const CONFETTI_PIECES = 40

export default function Confetti({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) {
      setVisible(false)
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: CONFETTI_PIECES }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 1.5
        const duration = 2 + Math.random() * 1.5
        const hue = Math.random() * 360
        const size = 6 + Math.random() * 8

        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm animate-confetti-fall"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.4}px`,
              backgroundColor: `hsl(${hue}, 80%, 60%)`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        )
      })}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-confetti-fall {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
