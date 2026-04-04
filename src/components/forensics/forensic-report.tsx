"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Clock,
  Fingerprint,
  Globe,
  CaretDown,
  MapTrifold,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { PostcardReport } from "@/src/lib/postcard";

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
  const { audit, triangulation, ocr } = report;
  const score = audit.totalScore;
  const pct = Math.round(score * 100);
  const color = scoreColor(score);
  const verdict = scoreVerdict(score);
  const isVerified = score >= 0.9;

  const [displayPct, setDisplayPct] = useState(0);
  const rafRef = useRef<number>(0);

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
      <style>{`
        .fr-accordion-content {
          overflow: hidden;
        }
        .fr-accordion-content[data-state="open"] {
          animation: fr-open 0.22s ease-out;
        }
        .fr-accordion-content[data-state="closed"] {
          animation: fr-close 0.22s ease-out;
        }
        @keyframes fr-open {
          from { height: 0; }
          to   { height: var(--radix-accordion-content-height); }
        }
        @keyframes fr-close {
          from { height: var(--radix-accordion-content-height); }
          to   { height: 0; }
        }
        .fr-accordion-trigger[data-state="open"] .fr-caret {
          transform: rotate(180deg);
        }
        .fr-caret { transition: transform 0.2s ease; }
      `}</style>

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
                <Globe size={11} style={{ color: "var(--postal-ink-muted)" }} />
              }
              text={ocr.postmark.platform}
            />
            {ocr.postmark.timestampText && (
              <MetaStamp
                icon={
                  <Clock
                    size={11}
                    style={{ color: "var(--postal-ink-muted)" }}
                  />
                }
                text={ocr.postmark.timestampText}
              />
            )}
            {ocr.postmark.username && (
              <MetaStamp
                icon={
                  <Fingerprint
                    size={11}
                    style={{ color: "var(--postal-ink-muted)" }}
                  />
                }
                text={ocr.postmark.username}
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
              <MapTrifold
                size={13}
                style={{ color: "var(--postal-ink-muted)" }}
              />
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
                {triangulation.queries.map((q, i) => (
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
              <Clock size={13} style={{ color: "var(--postal-ink-muted)" }} />
            }
            label="Audit Trail"
          >
            <div className="flex flex-col gap-1.5">
              {audit.auditLog.map((entry, i) => (
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
            <div className="grid grid-cols-3 gap-4">
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
              <ScoreGauge
                label="Visual"
                value={audit.visualScore}
                delay={1.1}
              />
            </div>
            <p
              className="mt-2 text-[9px] tracking-wide"
              style={{ color: "var(--postal-ink-faint)" }}
            >
              Score = 0.4 · Origin + 0.3 · Temporal + 0.3 · Visual
            </p>
          </TimelineNode>
        </motion.section>

        <div
          className="h-px"
          style={{ background: "var(--postal-ink-faint)" }}
        />

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <details className="group">
            <summary
              className="w-full flex items-center justify-between cursor-pointer px-3 py-2 list-none"
              style={{
                background: "var(--postal-paper-2)",
                border: "1px solid var(--postal-ink-faint)",
                fontFamily: "var(--font-serif)",
              }}
            >
              <span
                className="text-[10px] tracking-[0.2em] uppercase"
                style={{ color: "var(--postal-ink-muted)" }}
              >
                Semantic Diff — OCR vs. Live Page
              </span>
              <CaretDown
                size={12}
                className="fr-caret"
                style={{ color: "var(--postal-ink-muted)" }}
              />
            </summary>
            <div
              className="flex flex-col gap-4 p-4"
              style={{
                borderLeft: "1px solid var(--postal-ink-faint)",
                borderRight: "1px solid var(--postal-ink-faint)",
                borderBottom: "1px solid var(--postal-ink-faint)",
              }}
            >
              <div>
                <p
                  className="mb-1.5 text-[9px] tracking-widest uppercase"
                  style={{ color: "var(--postal-ink-faint)" }}
                >
                  Extracted OCR Text
                </p>
                <pre
                  className="text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink-muted)",
                    background: "var(--postal-paper-3)",
                    border: "1px dashed var(--postal-ink-faint)",
                    padding: "0.75rem",
                    maxHeight: "200px",
                  }}
                >
                  {ocr.markdown}
                </pre>
              </div>

              <div>
                <p
                  className="mb-1.5 text-[9px] tracking-widest uppercase"
                  style={{ color: "var(--postal-ink-faint)" }}
                >
                  Extracted Content
                </p>
                <div
                  className="text-xs leading-relaxed p-3"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink-muted)",
                    background: "var(--postal-paper-3)",
                    border: "1px dashed var(--postal-ink-faint)",
                  }}
                >
                  <p>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--postal-ink)" }}
                    >
                      Main text:
                    </span>{" "}
                    {ocr.postmark.mainText}
                  </p>

                  {ocr.postmark.engagement &&
                    Object.keys(ocr.postmark.engagement).length > 0 && (
                      <p className="mt-1">
                        <span
                          className="font-semibold"
                          style={{ color: "var(--postal-ink)" }}
                        >
                          Engagement:
                        </span>{" "}
                        {Object.entries(ocr.postmark.engagement)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    )}

                  {ocr.postmark.uiAnchors &&
                    ocr.postmark.uiAnchors.length > 0 && (
                      <p className="mt-1">
                        <span
                          className="font-semibold"
                          style={{ color: "var(--postal-ink)" }}
                        >
                          UI Anchors:
                        </span>{" "}
                        {ocr.postmark.uiAnchors
                          .map(
                            (a) =>
                              `${a.element} (${a.position}, ${Math.round(a.confidence * 100)}%)`,
                          )
                          .join(" · ")}
                      </p>
                    )}
                </div>
              </div>
            </div>
          </details>
        </motion.section>

        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <button
            className="text-xs tracking-widest uppercase px-6 py-2 cursor-pointer"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
              border: "1px solid var(--postal-ink-faint)",
              background: "var(--postal-paper)",
            }}
            onClick={() => window.location.reload()}
          >
            Trace Another Post
          </button>
        </motion.div>
      </div>

      <div className="h-2" style={{ backgroundImage: AIRMAIL_BG }} />
    </div>
  );
}
