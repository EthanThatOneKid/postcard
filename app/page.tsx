"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { LandingHook } from "@/components/ui/LandingHook";
import { Footer } from "@/components/ui/Footer";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AIRMAIL_BG = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)   0px  8px,
  var(--postal-paper) 8px 10px,
  var(--postal-blue) 10px 18px,
  var(--postal-paper) 18px 20px
)`;

export default function Home() {
  return (
    <main>
      {/* ── Hook section: quote + feature cards ── */}
      <LandingHook />

      {/* ── Airmail divider ── */}
      <div className="h-2" style={{ backgroundImage: AIRMAIL_BG }} aria-hidden="true" />

      {/* ── Call to action ── */}
      <section
        aria-label="Get started"
        className="px-6"
        style={{ background: "var(--postal-paper)" }}
      >
        <motion.div
          className="mx-auto max-w-xl py-20 flex flex-col items-center gap-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
        >
          <p
            className="text-[11px] tracking-[0.3em] uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
            }}
          >
            Ready to authenticate?
          </p>

          <p
            className="leading-snug italic"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
              color: "var(--postal-ink)",
            }}
          >
            Every screenshot tells a story.
            <br />
            Let&rsquo;s find out if it&rsquo;s true.
          </p>

          <Link
            href="/verify"
            className="inline-flex items-center gap-3 min-h-[44px] px-10 text-sm tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink)",
              border: "1px solid var(--postal-ink)",
              background: "var(--postal-paper)",
            }}
          >
            Enter Postcard
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <Footer />
    </main>
  );
}
