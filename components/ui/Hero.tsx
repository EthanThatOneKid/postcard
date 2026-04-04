'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: EASE },
})

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay },
})

export function Hero() {
  return (
    <section
      className="lab-grid-bg relative w-full overflow-hidden pt-16 pb-12 px-6"
    >
      {/* Scanline */}
      <div className="lab-scanline" aria-hidden />

      {/* Radial glow behind title */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(34,211,238,0.06) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl">

        {/* Top status bar */}
        <motion.div
          {...fadeIn(0)}
          className="flex items-center justify-between mb-14 text-[10px] tracking-[0.2em] uppercase"
          style={{ color: 'var(--lab-muted)' }}
        >
        </motion.div>

        {/* Main wordmark */}
        <div className="text-center mb-6">
          <motion.h1
            {...fadeUp(0.1)}
            className="text-[clamp(3.5rem,12vw,8rem)] font-bold leading-none tracking-[0.18em]"
            style={{
              color: 'var(--lab-text)',
              textShadow:
                '0 0 80px rgba(34,211,238,0.08), 0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            POSTCARD
          </motion.h1>

          {/* Accent rule */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.55, ease: EASE }}
            className="mx-auto mt-5 mb-5 h-px w-40"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--lab-cyan), transparent)',
            }}
          />

          <motion.p
            {...fadeUp(0.45)}
            className="text-[11px] sm:text-sm tracking-[0.35em] uppercase"
            style={{ color: 'var(--lab-muted)' }}
          >
            Trace every post back to its source.
          </motion.p>
        </div>

        {/* Bottom metadata strip */}
        <motion.div
          {...fadeIn(0.9)}
          className="mt-14 flex flex-wrap items-center justify-center gap-6 text-[10px] tracking-[0.18em] uppercase"
          style={{ color: 'var(--lab-muted-2)' }}
        >
        </motion.div>
      </div>
    </section>
  )
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <span>
      {label}:{' '}
      <span style={{ color: 'var(--lab-muted)' }}>{value}</span>
    </span>
  )
}

function Divider() {
  return (
    <span
      className="hidden sm:inline-block w-px h-3"
      style={{ background: 'var(--lab-border)' }}
    />
  )
}
