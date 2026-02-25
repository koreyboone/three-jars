// components/shared/count-up.tsx
'use client'

import { useEffect, useState } from 'react'

interface CountUpProps {
  target: number
  duration?: number
  prefix?: string
  className?: string
  formatFn?: (n: number) => string
}

export default function CountUp({
  target,
  duration = 800,
  prefix = '',
  className = '',
  formatFn,
}: CountUpProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) {
      setCurrent(target)
      return
    }

    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])

  const display = formatFn ? formatFn(current) : `${prefix}${current}`

  return <span className={className}>{display}</span>
}
