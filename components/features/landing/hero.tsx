"use client";

import { motion } from "motion/react";
import { Cloud, SmallCancelStamp } from "@/components/illustrations";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "640px" }}
    >
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            to bottom,
            var(--postal-sky-deep)  0%,
            var(--postal-sky-mid)  35%,
            var(--postal-sky)      60%,
            #d0eadc               80%,
            var(--postal-paper)   100%
          )`,
        }}
      />

      {/* Drifting clouds */}
      <svg
        className="absolute inset-0 w-full"
        style={{ height: "70%" }}
        viewBox="0 0 1200 280"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <Cloud cx={120} cy={60} scale={1.2} driftClass="cloud-drift" />
        <Cloud cx={480} cy={40} scale={0.85} driftClass="cloud-drift-slow" />
        <Cloud cx={820} cy={70} scale={1.0} driftClass="cloud-drift" />
        <Cloud cx={1050} cy={35} scale={0.7} driftClass="cloud-drift-slow" />
        <Cloud cx={300} cy={90} scale={0.6} driftClass="cloud-drift" />
        <Cloud cx={700} cy={110} scale={0.5} driftClass="cloud-drift-slow" />
      </svg>

      {/* Green hills — absolute bottom, z beneath content */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,90 C200,50 400,80 600,60 C800,40 1000,70 1200,55 L1200,120 L0,120 Z"
          fill="var(--postal-green-far)"
          opacity="0.6"
        />
        <path
          d="M0,100 C150,70 350,95 550,80 C750,65 950,90 1200,78 L1200,120 L0,120 Z"
          fill="var(--postal-green-mid)"
          opacity="0.7"
        />
        <path
          d="M0,112 C100,98 300,108 500,104 C700,99 900,110 1200,106 L1200,120 L0,120 Z"
          fill="var(--postal-green-near)"
        />
      </svg>

      {/* Cancel stamp — decorative, top right */}
      <motion.div
        className="absolute top-6 right-8 opacity-30 pointer-events-none"
        initial={{ opacity: 0, rotate: -12, scale: 0.8 }}
        animate={{ opacity: 0.25, rotate: -15, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      >
        <SmallCancelStamp className="w-24 h-24" />
      </motion.div>

      {/* Content — stacks title → divider → tagline → input panel in the sky */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-48 px-6 text-center">
        {/* Airmail stripe — key visual separator at very top */}
        <motion.div
          className="w-full absolute top-0 left-0 h-3"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              var(--postal-red) 0px, var(--postal-red) 6px,
              transparent 6px, transparent 12px,
              var(--postal-blue) 12px, var(--postal-blue) 18px,
              transparent 18px, transparent 24px
            )`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
        >
          <h1
            className="font-black italic leading-none mb-1"
            style={{
              fontFamily: "var(--font-display), serif",
              fontSize: "clamp(4rem, 14vw, 9rem)",
              color: "var(--postal-paper)",
              textShadow:
                "2px 4px 12px rgba(44,36,22,0.35), 0 1px 0 rgba(44,36,22,0.15)",
              letterSpacing: "-0.02em",
            }}
          >
            Postcard
          </h1>
        </motion.div>

        <motion.div
          className="flex items-center gap-4 mb-4 mt-1"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <div
            className="h-px w-16"
            style={{ background: "rgba(253,246,227,0.5)" }}
          />
          <span
            className="text-[11px] tracking-[0.35em] uppercase"
            style={{
              color: "rgba(253,246,227,0.7)",
              fontFamily: "var(--font-serif)",
            }}
          >
            Est. 2026
          </span>
          <div
            className="h-px w-16"
            style={{ background: "rgba(253,246,227,0.5)" }}
          />
        </motion.div>

        <motion.p
          className="text-base italic mb-8"
          style={{
            fontFamily: "var(--font-serif), serif",
            color: "rgba(253,246,227,0.85)",
            letterSpacing: "0.06em",
            maxWidth: "380px",
            textShadow: "0 1px 4px rgba(44,36,22,0.25)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.65 }}
        >
          Trace every post back to its source.
        </motion.p>

        {/* Input panel — in the sky, enters after title sequence */}
        {children && (
          <motion.div
            className="w-full flex justify-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 1.0, ease: EASE }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
