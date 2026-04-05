"use client";

import { motion } from "motion/react";
import { MagnifyingGlass, MapTrifold, Seal } from "@phosphor-icons/react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FEATURES = [
  {
    Icon: MagnifyingGlass,
    title: "Spot the Fabricated",
    body: "Cross-reference screenshots against live post metadata. Surface alterations in captions, timestamps, and engagement counts.",
  },
  {
    Icon: MapTrifold,
    title: "Trace the Origin",
    body: "Navigate from screenshot to primary source URL using AI-guided forensic search and platform-specific dorking.",
  },
  {
    Icon: Seal,
    title: "Trust the Source",
    body: "Corroborate claims against a vetted allowlist of journalism, government, and academic institutions.",
  },
] as const;

export function LandingHook() {
  return (
    <section
      id="why-it-matters"
      aria-labelledby="hook-heading"
      style={{
        background: "var(--postal-paper-2)",
        borderBottom: "1px solid var(--postal-ink-faint)",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 py-16">

        {/* Eyebrow */}
        <motion.p
          className="text-[11px] tracking-[0.3em] uppercase mb-5"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--postal-ink-muted)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Why It Matters
        </motion.p>

        {/* Main hook */}
        <motion.blockquote
          className="mb-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.1, ease: EASE }}
        >
          <p
            id="hook-heading"
            className="leading-snug italic"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.35rem, 3.5vw, 2rem)",
              color: "var(--postal-ink)",
            }}
          >
            &ldquo;In an era of digital echoes, knowing what is real isn&rsquo;t
            just a preference&mdash;it&rsquo;s a necessity.&rdquo;
          </p>
        </motion.blockquote>

        {/* Sub-hook */}
        <motion.p
          className="text-base leading-relaxed mb-12"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--postal-ink)",
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
        >
          <span style={{ color: "var(--postal-red)", fontWeight: 600 }}>
            Spot the fabricated.
          </span>{" "}
          <span style={{ color: "var(--postal-blue)", fontWeight: 600 }}>
            Trace the origin.
          </span>{" "}
          <span style={{ color: "var(--postal-green-near)", fontWeight: 600 }}>
            Trust the source.
          </span>
        </motion.p>

        {/* Feature grid — gap-px trick for hairline grid lines */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{
            border: "1px solid var(--postal-ink-faint)",
            background: "var(--postal-ink-faint)",
            gap: "1px",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        >
          {FEATURES.map(({ Icon, title, body }, i) => (
            <div
              key={i}
              className="p-6 flex flex-col gap-3"
              style={{ background: "var(--postal-paper)" }}
            >
              <div
                className="flex items-center justify-center w-9 h-9"
                style={{
                  background: "var(--postal-paper-2)",
                  border: "1px solid var(--postal-ink-faint)",
                }}
              >
                <Icon size={16} style={{ color: "var(--postal-ink-muted)" }} />
              </div>
              <h3
                className="text-sm font-semibold tracking-[0.08em] uppercase"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                }}
              >
                {title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
