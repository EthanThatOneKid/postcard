"use client";

import { motion } from "motion/react";

function CancelStamp({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <circle
        cx="50"
        cy="50"
        r="37"
        stroke="var(--postal-red)"
        strokeWidth="1"
      />
      <line
        x1="5"
        y1="42"
        x2="95"
        y2="42"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <line
        x1="5"
        y1="50"
        x2="95"
        y2="50"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <line
        x1="5"
        y1="58"
        x2="95"
        y2="58"
        stroke="var(--postal-red)"
        strokeWidth="2.5"
      />
      <path id="stamp-arc-top" d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
      <path id="stamp-arc-bot" d="M 15,50 A 35,35 0 0,0 85,50" fill="none" />
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif), serif"
        letterSpacing="2"
      >
        <textPath href="#stamp-arc-top" startOffset="10%">
          POSTCARD · FORENSICS
        </textPath>
      </text>
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif), serif"
        letterSpacing="2"
      >
        <textPath href="#stamp-arc-bot" startOffset="15%">
          LAB · EST. 2026 ·
        </textPath>
      </text>
    </svg>
  );
}

function WaxSeal() {
  return (
    <div className="wax-seal-active flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 52 52" className="w-12 h-12" fill="none">
        <circle cx="26" cy="26" r="24" fill="var(--postal-wax)" />
        <circle
          cx="26"
          cy="26"
          r="20"
          fill="none"
          stroke="rgba(244,192,90,0.5)"
          strokeWidth="1"
        />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          const rad = (angle * Math.PI) / 180;
          const x = 26 + 16 * Math.cos(rad);
          const y = 26 + 16 * Math.sin(rad);
          return (
            <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(244,192,90,0.6)" />
          );
        })}
        <text
          x="26"
          y="32"
          textAnchor="middle"
          fill="#f4c05a"
          fontSize="18"
          fontFamily="var(--font-display), serif"
          fontWeight="700"
          fontStyle="italic"
        >
          P
        </text>
      </svg>
      <span
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{
          color: "var(--postal-ink-muted)",
          fontFamily: "var(--font-serif)",
        }}
      >
        Postal Service Active
      </span>
    </div>
  );
}

function Cloud({
  cx,
  cy,
  scale = 1,
  driftClass = "cloud-drift",
}: {
  cx: number;
  cy: number;
  scale?: number;
  driftClass?: string;
}) {
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${scale})`}
      style={{
        animation: `${driftClass} ${12 + scale * 8}s ease-in-out infinite alternate`,
      }}
    >
      <ellipse
        cx="0"
        cy="0"
        rx="38"
        ry="22"
        fill="var(--postal-cloud)"
        opacity="0.92"
      />
      <ellipse
        cx="28"
        cy="-10"
        rx="28"
        ry="18"
        fill="var(--postal-cloud)"
        opacity="0.88"
      />
      <ellipse
        cx="-26"
        cy="-6"
        rx="22"
        ry="16"
        fill="var(--postal-cloud)"
        opacity="0.88"
      />
      <ellipse cx="8" cy="-18" rx="18" ry="14" fill="white" opacity="0.7" />
    </g>
  );
}

export function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "460px" }}
    >
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

      <motion.div
        className="absolute top-6 right-8 opacity-30 pointer-events-none"
        initial={{ opacity: 0, rotate: -12, scale: 0.8 }}
        animate={{ opacity: 0.25, rotate: -15, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
      >
        <CancelStamp className="w-24 h-24" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center pt-16 pb-24 px-6 text-center">
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
          transition={{
            duration: 0.8,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
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
          className="text-base italic mb-10"
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

        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.85,
            type: "spring",
            bounce: 0.3,
          }}
        >
          <WaxSeal />
        </motion.div>
      </div>
    </section>
  );
}
