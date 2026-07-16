'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delayMs?: number
  id?: string
}

// Scroll-triggered fade-up used on every landing-page section below the
// fold. Plain IntersectionObserver + CSS transition -- no animation
// library needed for something this simple. Fires once (observer
// disconnects after the first intersection) so scrolling back up and down
// doesn't replay it. The .reveal / .reveal.is-visible classes live in
// globals.css, including the prefers-reduced-motion opt-out.
export default function Reveal({ children, className = '', delayMs = 0, id }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      id={id}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}
