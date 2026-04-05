"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  Fingerprint,
  MapPin,
  MagnifyingGlass,
  ShieldCheck,
  ArrowRight,
  ShareNetwork,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { PostcardReport, Corroboration } from "@/src/lib/postcard";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AIRMAIL_BG = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)  0px  8px,
  var(--postal-paper) 8px 10px,
  var(--postal-blue) 10px 18px,
  var(--postal-paper) 18px 20px
)`;

function scoreColor(s: number) {
  if (s >= 0.9) return "var(--postal-green-near)";
  if (s >= 0.5) return "var(--postal-amber)";
  return "var(--postal-red)";
}

function scoreVerdict(s: number) {
  if (s >= 0.9) return "Verified Origin";
  if (s >= 0.5) return "Unreliable Post";
  return "Fabricated";
}

function CancelStamp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden>
      <circle
        cx="60"
        cy="60"
        r="55"
        stroke="var(--postal-red)"
        strokeWidth="3"
      />
      <circle
        cx="60"
        cy="60"
        r="46"
        stroke="var(--postal-red)"
        strokeWidth="1.2"
      />
      <circle
        cx="60"
        cy="60"
        r="37"
        stroke="var(--postal-red)"
        strokeWidth="1"
      />
      {[40, 50, 60, 70, 80].map((y) => (
        <line
          key={y}
          x1="5"
          y1={y}
          x2="115"
          y2={y}
          stroke="var(--postal-red)"
          strokeWidth="2.5"
        />
      ))}
      <path id="cancel-top" d="M 18,55 A 42,42 0 0,1 102,55" fill="none" />
      <path id="cancel-bot" d="M 18,65 A 42,42 0 0,0 102,65" fill="none" />
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif)"
      >
        <textPath href="#cancel-top" startOffset="8%">
          POSTCARD FORENSICS
        </textPath>
      </text>
      <text
        fontSize="7.5"
        fill="var(--postal-red)"
        fontFamily="var(--font-serif)"
      >
        <textPath href="#cancel-bot" startOffset="8%">
          VERIFIED ✦ AUTHENTICATED
        </textPath>
      </text>
    </svg>
  );
}

function ScoreGauge({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: number;
  delay?: number;
}) {
  const pct = Math.round(value * 100);
  const color = scoreColor(value);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span
          className="text-[9px] tracking-widest uppercase"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--postal-ink-muted)",
          }}
        >
          {label}
        </span>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ fontFamily: "var(--font-serif)", color }}
        >
          {pct}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-none"
        style={{ background: "var(--postal-paper-3)" }}
      >
        <motion.div
          className="h-full rounded-none"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay, ease: EASE }}
        />
      </div>
    </div>
  );
}

function TimelineNode({
  icon,
  label,
  isLast = false,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="flex shrink-0 items-center justify-center rounded-none"
          style={{
            width: "28px",
            height: "28px",
            background: "var(--postal-paper-2)",
            border: "1px solid var(--postal-ink-faint)",
          }}
        >
          {icon}
        </div>
        {!isLast && (
          <div
            className="mt-1 flex-1 border-l-2 border-dashed"
            style={{
              borderColor: "var(--postal-ink-faint)",
              minHeight: "28px",
            }}
          />
        )}
      </div>
      <div className={cn("flex-1", !isLast && "pb-6")}>
        <p
          className="mb-2 text-[9px] tracking-[0.25em] uppercase"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--postal-ink-muted)",
          }}
        >
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

function MetaStamp({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
      style={{
        border: "1px solid var(--postal-ink-faint)",
        background: "var(--postal-paper)",
        fontFamily: "var(--font-serif)",
        color: "var(--postal-ink)",
      }}
    >
      {icon}
      {text}
    </div>
  );
}

export function ForensicReport({ report }: { report: PostcardReport }) {
  const { audit, triangulation, postcard, corroboration } = report;
  const score = audit.totalScore;
  const pct = Math.round(score * 100);
  const color = scoreColor(score);
  const verdict = scoreVerdict(score);
  const isVerified = score >= 0.9;

  const [displayPct, setDisplayPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const rafRef = useRef<number>(0);

  const handleShare = async () => {
    const url = `${window.location.origin}/${report.triangulation.targetUrl}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <section className="flex flex-col items-center gap-5 text-center">
          <motion.div
            initial={{ scale: 1.5, rotate: -5, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: EASE }}
            className="relative"
          >
            <div
              className="relative inline-flex flex-col items-center justify-center px-12 py-7"
              style={{
                background: "var(--postal-paper-2)",
                border: "2px solid var(--postal-ink-faint)",
              }}
            >
              {isVerified && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <CancelStamp className="h-36 w-36 opacity-30" />
                </div>
              )}
              <p
                className="text-[9px] tracking-[0.3em] uppercase"
                style={{ color: "var(--postal-ink-muted)" }}
              >
                Postcard Score
              </p>
              <p
                className="mt-1 tabular-nums leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(3rem, 8vw, 5rem)",
                  fontWeight: 900,
                  color,
                }}
              >
                {displayPct}
                <span
                  className="text-xl"
                  style={{ color: "var(--postal-ink-faint)", fontWeight: 400 }}
                >
                  /100
                </span>
              </p>
              <p
                className="mt-1.5 text-xs font-semibold tracking-wide"
                style={{ color }}
              >
                {verdict}
              </p>

              <button
                onClick={handleShare}
                className="mt-6 flex items-center gap-2 group transition-all duration-300"
              >
                <div
                  className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase font-bold transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: copied ? "var(--postal-blue)" : "var(--postal-paper)",
                    color: copied ? "var(--postal-paper)" : "var(--postal-blue)",
                    border: "1px solid var(--postal-blue)",
                  }}
                >
                  {copied ? (
                    <ShieldCheck size={14} weight="fill" />
                  ) : (
                    <ShareNetwork size={14} />
                  )}
                  {copied ? "Copied to Clipboard" : "Share Forensic Link"}
                </div>
              </button>
            </div>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
          >
            <MetaStamp
              icon={
                <ShieldCheck
                  size={11}
                  style={{ color: "var(--postal-ink-muted)" }}
                />
              }
              text={postcard.platform}
            />
            {postcard.timestampText && (
              <MetaStamp
                icon={
                  <Clock
                    size={11}
                    style={{ color: "var(--postal-ink-muted)" }}
                  />
                }
                text={postcard.timestampText}
              />
            )}
            {postcard.username && (
              <MetaStamp
                icon={
                  <Fingerprint
                    size={11}
                    style={{ color: "var(--postal-ink-muted)" }}
                  />
                }
                text={postcard.username}
              />
            )}
          </motion.div>
        </section>

        <div
          className="h-px"
          style={{ background: "var(--postal-ink-faint)" }}
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

          <TimelineNode
            icon={
              <MapPin size={13} style={{ color: "var(--postal-ink-muted)" }} />
            }
            label="Origin"
          >
            {triangulation.targetUrl ? (
              <a
                href={triangulation.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-xs underline underline-offset-2"
                style={{ color: "var(--postal-blue)" }}
              >
                {triangulation.targetUrl}
              </a>
            ) : (
              <p
                className="text-xs italic"
                style={{ color: "var(--postal-ink-faint)" }}
              >
                Point of Origin Obscured
              </p>
            )}
            {triangulation.queries.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {triangulation.queries.map((q: string, i: number) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5"
                    style={{
                      background: "var(--postal-paper-3)",
                      border: "1px solid var(--postal-ink-faint)",
                      color: "var(--postal-ink-muted)",
                    }}
                  >
                    {q}
                  </span>
                ))}
              </div>
            )}
          </TimelineNode>

          <TimelineNode
            icon={
              <MagnifyingGlass
                size={13}
                style={{ color: "var(--postal-ink-muted)" }}
              />
            }
            label="Verification Grounding"
          >
            <div className="flex flex-col gap-4">
              <div
                className="p-3 text-[11px] italic leading-relaxed"
                style={{
                  background: "var(--postal-paper-3)",
                  border: "1px solid var(--postal-ink-faint)",
                  color: "var(--postal-ink)",
                  borderLeft: "2px solid var(--postal-blue)",
                }}
              >
                &ldquo;{corroboration.summary}&rdquo;
              </div>

              {corroboration.primarySources.length > 0 && (
                <div className="flex flex-col gap-3">
                  {corroboration.primarySources.map(
                    (
                      source: Corroboration["primarySources"][number],
                      i: number,
                    ) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex flex-col gap-1.5 p-3"
                        style={{
                          background: "var(--postal-paper-2)",
                          border: "1px solid var(--postal-ink-faint)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[9px] font-bold tracking-widest uppercase"
                              style={{ color: "var(--postal-blue)" }}
                            >
                              {source.source}
                            </span>
                            {source.publishedDate && (
                              <span
                                className="text-[8px]"
                                style={{ color: "var(--postal-ink-faint)" }}
                              >
                                {source.publishedDate}
                              </span>
                            )}
                          </div>
                          <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[8px] font-bold uppercase tracking-tighter"
                            style={{
                              background:
                                source.relevance === "supporting"
                                  ? "var(--postal-green-faint)"
                                  : source.relevance === "refuting"
                                    ? "var(--postal-red-faint)"
                                    : "var(--postal-paper-3)",
                              color:
                                source.relevance === "supporting"
                                  ? "var(--postal-green-near)"
                                  : source.relevance === "refuting"
                                    ? "var(--postal-red)"
                                    : "var(--postal-ink-muted)",
                              border: "1px solid currentColor",
                            }}
                          >
                            {source.relevance === "supporting" && (
                              <ShieldCheck size={10} weight="fill" />
                            )}
                            {source.relevance}
                          </div>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold leading-tight hover:underline flex items-center gap-1"
                          style={{ color: "var(--postal-ink)" }}
                        >
                          {source.title}
                          <ArrowRight size={10} />
                        </a>
                        <p
                          className="text-[10px] leading-relaxed line-clamp-2"
                          style={{ color: "var(--postal-ink-muted)" }}
                        >
                          {source.snippet}
                        </p>
                      </motion.div>
                    ),
                  )}
                </div>
              )}

              {corroboration.queriesExecuted.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {corroboration.queriesExecuted.map(
                    (
                      q: Corroboration["queriesExecuted"][number],
                      i: number,
                    ) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-2 py-1 text-[9px]"
                        style={{
                          background: "var(--postal-paper-3)",
                          border: "1px dashed var(--postal-ink-faint)",
                          color: "var(--postal-ink-muted)",
                        }}
                      >
                        <MagnifyingGlass size={10} />
                        {q.query}
                        <span style={{ color: "var(--postal-ink-faint)" }}>
                          ({q.sourcesFound})
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </TimelineNode>

          <TimelineNode
            icon={
              <MagnifyingGlass
                size={13}
                style={{ color: "var(--postal-ink-muted)" }}
              />
            }
            label="Corroboration Trace"
          >
            <div className="flex flex-col gap-1.5">
              {corroboration.corroborationLog.map(
                (entry: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className="mt-px shrink-0 px-1 text-[9px] leading-tight text-center tabular-nums"
                      style={{
                        background: "var(--postal-blue-faint)",
                        color: "var(--postal-blue)",
                        border: "1px solid var(--postal-blue-faint)",
                        minWidth: "20px",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--postal-ink-muted)" }}
                    >
                      {entry}
                    </p>
                  </div>
                ),
              )}
            </div>
          </TimelineNode>

          <TimelineNode
            icon={
              <Clock size={13} style={{ color: "var(--postal-ink-muted)" }} />
            }
            label="Audit Trail"
          >
            <div className="flex flex-col gap-1.5">
              {audit.auditLog.map((entry: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="mt-px shrink-0 px-1 text-[9px] leading-tight text-center tabular-nums"
                    style={{
                      background: "var(--postal-ink-muted)",
                      color: "var(--postal-paper)",
                      minWidth: "20px",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--postal-ink-muted)" }}
                  >
                    {entry}
                  </p>
                </div>
              ))}
            </div>
          </TimelineNode>

          <TimelineNode
            icon={
              <Fingerprint
                size={13}
                style={{ color: "var(--postal-ink-muted)" }}
              />
            }
            label="Forensic Breakdown"
            isLast
          >
            <div className="grid grid-cols-2 gap-4">
              <ScoreGauge
                label="Origin"
                value={audit.originScore}
                delay={0.9}
              />
              <ScoreGauge
                label="Temporal"
                value={audit.temporalScore}
                delay={1.0}
              />
            </div>
            <p
              className="mt-2 text-[9px] tracking-wide"
              style={{ color: "var(--postal-ink-faint)" }}
            >
              Score = 0.5 · Origin + 0.5 · Temporal
            </p>
          </TimelineNode>
        </motion.section>

        <div
          className="h-px"
          style={{ background: "var(--postal-ink-faint)" }}
        />

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <button
            className="flex items-center gap-2 text-xs tracking-widest uppercase px-6 py-2 cursor-pointer transition-colors"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
              border: "1px solid var(--postal-ink-faint)",
              background: "var(--postal-paper)",
            }}
            onClick={handleShare}
          >
            {copied ? (
              <ShieldCheck size={14} weight="fill" />
            ) : (
              <ShareNetwork size={14} />
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
            onClick={() => {
              window.location.href = `/?url=${encodeURIComponent(report.triangulation.targetUrl || "")}&forceRefresh=true`;
            }}
          >
            <ArrowsClockwise size={14} />
            Re-verify Latest
          </button>

          <button
            className="text-xs tracking-widest uppercase px-6 py-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
              border: "1px solid var(--postal-ink-faint)",
              background: "transparent",
            }}
            onClick={() => {
              window.location.href = "/";
            }}
          >
            Trace Another Post
          </button>
        </motion.div>
      </div>

      <div className="h-2" style={{ backgroundImage: AIRMAIL_BG }} />
    </div>
  );
}
