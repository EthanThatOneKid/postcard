"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Share2, RotateCw, Search } from "lucide-react";
import type { PostcardReport } from "@/src/api/schemas";
import { ScoreDisplay, MetaStamps } from "./score-display";
import { TravelTimeline } from "./timeline";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AIRMAIL_BG = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)  0px  8px,
  var(--postal-paper) 8px 10px,
  var(--postal-blue) 10px 18px,
  var(--postal-paper) 18px 20px
)`;

function ReportActions({
  copied,
  onShare,
  onReverify,
  onHome,
}: {
  copied: boolean;
  onShare: () => void;
  onReverify: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <button
        className="text-sm tracking-widest uppercase px-6 cursor-pointer inline-flex items-center justify-center min-h-[44px]"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--postal-ink)",
          border: "1px solid var(--postal-ink-muted)",
          background: "var(--postal-paper)",
        }}
        onClick={onShare}
      >
        {copied ? (
          <ShieldCheck size={14} className="fill-current" />
        ) : (
          <Share2 size={14} />
        )}
        {copied ? "Copied" : "Copy Share Link"}
      </button>

      <button
        className="flex items-center gap-2 text-xs tracking-widest uppercase px-6 py-2 cursor-pointer transition-colors hover:bg-[var(--postal-amber-faint)]"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--postal-ink-muted)",
          border: "1px solid var(--postal-amber-faint)",
          background: "var(--postal-paper)",
        }}
        onClick={onReverify}
      >
        <RotateCw size={14} />
        Re-verify Latest
      </button>

      <button
        className="text-xs tracking-widest uppercase px-6 py-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
        style={{
          fontFamily: "var(--font-serif)",
          color: "var(--postal-ink-muted)",
          border: "1px solid var(--postal-ink-muted)",
          background: "transparent",
        }}
        onClick={onHome}
      >
        Trace Another Post
      </button>
    </div>
  );
}

export function ForensicReport({ report }: { report: PostcardReport }) {
  const { audit, triangulation, postcard, corroboration } = report;
  const score = audit.totalScore;
  const pct = Math.round(score * 100);
  const isVerified = score >= 0.9;

  const [displayPct, setDisplayPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const rafRef = useRef<number>(0);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/postcards?url=${encodeURIComponent(report.triangulation.targetUrl ?? "")}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReverify = () => {
    window.location.href = `/?url=${encodeURIComponent(report.triangulation.targetUrl || "")}&refresh=true`;
  };

  const handleHome = () => {
    window.location.href = "/";
  };

  useEffect(() => {
    const duration = 1600;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPct(Math.round(eased * pct));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pct]);

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: "var(--postal-paper)",
        fontFamily: "var(--font-serif)",
      }}
    >
      <div className="h-2" style={{ backgroundImage: AIRMAIL_BG }} />

      <div className="mx-auto max-w-2xl px-6 py-12 flex flex-col gap-8">
        <motion.section
          className="flex flex-col items-center gap-5 text-center"
          initial={{ opacity: 0, scale: 1.5, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          <motion.div
            className="relative"
            initial={{ scale: 1.5, rotate: -5, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: EASE }}
          >
            <ScoreDisplay
              score={score}
              displayPct={displayPct}
              isVerified={isVerified}
              reason={corroboration.summary}
            />
          </motion.div>

          <button
            onClick={handleShare}
            className="mt-6 flex items-center gap-2 group transition-all duration-300"
          >
            <div
              className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase font-bold transition-all duration-300 group-hover:scale-105"
              style={{
                background: copied
                  ? "var(--postal-blue)"
                  : "var(--postal-paper)",
                color: copied ? "var(--postal-paper)" : "var(--postal-blue)",
                border: "1px solid var(--postal-blue)",
              }}
            >
              {copied ? (
                <ShieldCheck size={14} className="fill-current" />
              ) : (
                <Share2 size={14} />
              )}
              {copied ? "Copied to Clipboard" : "Share Forensic Link"}
            </div>
          </button>

          <motion.div
            className="flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
          >
            <MetaStamps
              platform={postcard.platform}
              timestampText={postcard.timestampText}
              username={postcard.username}
            />
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase"
              style={{
                border: "1px solid var(--postal-blue)",
                background: "var(--postal-blue-faint)",
                color: "var(--postal-blue)",
              }}
            >
              <Search size={12} />
              Verified via Postcard
            </div>
          </motion.div>
        </motion.section>

        <div
          className="h-px"
          style={{ background: "var(--postal-ink-muted)" }}
        />

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
        >
          <p
            className="mb-5 text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "var(--postal-ink-muted)" }}
          >
            Travel Log
          </p>

          <TravelTimeline
            triangulation={triangulation}
            corroboration={corroboration}
            audit={audit}
          />
        </motion.section>

        <div
          className="h-px"
          style={{ background: "var(--postal-ink-muted)" }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <ReportActions
            copied={copied}
            onShare={handleShare}
            onReverify={handleReverify}
            onHome={handleHome}
          />
        </motion.div>
      </div>

      <div className="h-2" style={{ backgroundImage: AIRMAIL_BG }} />
    </div>
  );
}
