"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { PostcardReport } from "@/src/lib/postcard";
import { PaperPlane, Cloud } from "@/components/illustrations";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Resolved value used directly in filter — CSS variables are not interpolatable
// by the browser animation engine, so we use the raw hex here.
const POSTAL_BLUE_HEX = "#2464a0";

export type AnalysisStage = 0 | 1 | 2 | 3 | 4;

interface StageInfo {
  label: string;
  detail: string;
  mailboxX: number;
}

const STAGES: StageInfo[] = [
  {
    label: "Ingestion Agent",
    detail: "Fetching live content via Unified Client…",
    mailboxX: 22,
  },
  {
    label: "Navigator Agent",
    detail: "Building search queries via Gemini…",
    mailboxX: 50,
  },
  {
    label: "Forensic Verifier",
    detail: "Cross-referencing sources & timestamps…",
    mailboxX: 78,
  },
];

/** USPS-style collection box rendered entirely in SVG.
 *  Caller wraps with <g transform="translate(bx, by)"> for positioning.
 *  Internal coordinates: 96 wide × 130 tall, grounded at y=130. */
function CollectionBox({
  active,
  passed,
  label,
}: {
  active: boolean;
  passed: boolean;
  label: string;
}) {
  const bodyColor = passed
    ? "var(--postal-red)"
    : active
      ? "var(--postal-blue)"
      : "#1a4a78";

  return (
    <g>
      {/* Legs */}
      <rect x="18" y="108" width="10" height="22" rx="2" fill="#0f2d4a" />
      <rect x="68" y="108" width="10" height="22" rx="2" fill="#0f2d4a" />

      {/* Main body */}
      <rect x="0" y="18" width="96" height="92" rx="6" fill={bodyColor} />

      {/* Curved cap */}
      <ellipse cx="48" cy="18" rx="48" ry="10" fill={bodyColor} />

      {/* Top highlight stripe */}
      <ellipse
        cx="48"
        cy="18"
        rx="44"
        ry="7"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2"
      />

      {/* Mail slot */}
      <rect x="18" y="40" width="60" height="6" rx="3" fill="#0f2d4a" />
      <rect
        x="18"
        y="40"
        width="60"
        height="3"
        rx="1.5"
        fill="rgba(0,0,0,0.3)"
      />

      {/* Status panel background */}
      <rect
        x="10"
        y="56"
        width="76"
        height="42"
        rx="3"
        fill="var(--postal-paper-2)"
        stroke="var(--postal-ink-faint)"
        strokeWidth="0.75"
      />

      {/* Status label — foreignObject for rich typography */}
      <foreignObject x="10" y="56" width="76" height="42">
        <div
          // @ts-expect-error — xmlns required for SVG foreignObject
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 6px",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "8.5px",
              lineHeight: 1.3,
              color: "var(--postal-ink)",
              textAlign: "center",
              fontStyle: active ? "italic" : "normal",
              fontWeight: passed ? 600 : 400,
              display: "block",
            }}
          >
            {passed ? "✓ " + label : label}
          </span>
        </div>
      </foreignObject>

      {/* COLLECTION BOX micro-label */}
      <text
        x="48"
        y="106"
        textAnchor="middle"
        fontSize="5.5"
        fill="rgba(255,255,255,0.55)"
        fontFamily="var(--font-serif), serif"
        letterSpacing="0.8"
      >
        COLLECTION BOX
      </text>

      {/* Left bevel highlight */}
      <rect
        x="0"
        y="22"
        width="4"
        height="84"
        rx="2"
        fill="rgba(255,255,255,0.12)"
      />
    </g>
  );
}

type ApiProgress = {
  stage: string;
  message: string;
  progress: number;
};

async function fetchReportWithProgress(
  postUrl: string,
  onProgress: (progress: ApiProgress) => void,
  forceRefresh?: boolean,
): Promise<PostcardReport> {
  const response = await fetch("/api/postcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: postUrl, forceRefresh }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Analysis request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const eventMatch = block.match(/^event: (\w+)/m);
      const dataMatch = block.match(/^data: (.+)/m);
      if (!eventMatch || !dataMatch) continue;

      const event = eventMatch[1];
      const payload = JSON.parse(dataMatch[1]);

      if (event === "progress") {
        onProgress(payload as ApiProgress);
      } else if (event === "complete") {
        return payload.forensicReport as PostcardReport;
      } else if (event === "error") {
        throw new Error(payload.error);
      }
    }
  }

  throw new Error("Stream ended without a result.");
}

export function AnalysisJourney({
  postUrl,
  forceRefresh,
  cachedReport,
  onComplete,
  onReset,
}: {
  postUrl: string;
  forceRefresh?: boolean;
  /** When set, skip the API call and animate through stages using this report. */
  cachedReport?: PostcardReport | null;
  onComplete: (report: PostcardReport) => void;
  onReset: () => void;
}) {
  const [stage, setStage] = useState<AnalysisStage>(0);
  const [stageLabel, setStageLabel] = useState("Dispatched");
  const [stageDetail, setStageDetail] = useState("Evidence en route…");
  const [error, setError] = useState<string | null>(null);
  const [failedReport, setFailedReport] = useState<PostcardReport | null>(null);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    document.title = error
      ? "Analysis Failed | Postcard"
      : `${stageLabel} | Postcard`;
  }, [stageLabel, error]);

  useEffect(() => {
    // ── Cached-report fast-path ─────────────────────────────────────
    // Report is already available; animate through stages for the minimum
    // display time, then hand off to the parent.
    if (cachedReport) {
      const steps: [number, AnalysisStage, string, string][] = [
        [200,  1, STAGES[0].label, STAGES[0].detail],
        [900,  2, STAGES[1].label, STAGES[1].detail],
        [1600, 3, STAGES[2].label, STAGES[2].detail],
        [2300, 4, "Complete",      "Evidence authenticated."],
      ];

      const timers = steps.map(([delay, s, label, detail]) =>
        setTimeout(() => {
          setStage(s);
          setStageLabel(label);
          setStageDetail(detail);
        }, delay),
      );

      const doneTimer = setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onCompleteRef.current(cachedReport);
        }
      }, 2900);

      return () => {
        [...timers, doneTimer].forEach(clearTimeout);
      };
    }

    // ── Live SSE path ───────────────────────────────────────────────
    fetchReportWithProgress(
      postUrl,
      (progress) => {
        const { stage: serverStage, message, progress: pct } = progress;
        setStageLabel(serverStage === "starting" ? "Dispatched" : serverStage);
        setStageDetail(message);

        if (pct < 0.33) setStage(1);
        else if (pct < 0.66) setStage(2);
        else if (pct < 1) setStage(3);
        else setStage(4);
      },
      forceRefresh,
    )
      .then((report) => {
        const hasContent = !!(
          report.markdown && report.markdown.trim().length > 50
        );

        if (
          report.corroboration.verdict === "insufficient_data" &&
          !hasContent
        ) {
          setError(
            report.corroboration.summary ||
              "Unable to locate the linked content. The URL may be inaccessible or require authentication.",
          );
          setFailedReport(report);
          hasCompletedRef.current = true;
          return;
        }

        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setTimeout(() => onCompleteRef.current(report), 800);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Analysis failed");
        console.error("Analysis failed:", err);
      });
  }, [postUrl, forceRefresh, cachedReport]);

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: `linear-gradient(
          to bottom,
          var(--postal-sky-deep) 0%,
          var(--postal-sky-mid) 30%,
          var(--postal-sky)     55%,
          #c8e8d0               72%,
          var(--postal-paper)   100%
        )`,
      }}
    >
      {/* Static paper plane — top-left sky */}
      <div
        className="absolute pointer-events-none"
        style={{ top: "8%", left: "6%" }}
      >
        <PaperPlane className="w-28 h-auto drop-shadow-md opacity-90" />
      </div>

      {/* Landscape + Collection Boxes */}
      <div className="absolute inset-x-0" style={{ top: "15%" }}>
        <svg
          viewBox="0 0 1200 380"
          className="w-full"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
        >
          {/* Clouds */}
          <Cloud cx={380} cy={20} scale={0.8} delay={3} />
          <Cloud cx={800} cy={50} scale={1.0} delay={6} />
          <Cloud cx={1050} cy={25} scale={0.7} delay={2} />
          <Cloud cx={280} cy={70} scale={0.55} delay={9} />

          {/* Rolling hills */}
          <path
            d="M0,220 C200,160 400,195 600,175 C800,150 1000,188 1200,170 L1200,380 L0,380 Z"
            fill="var(--postal-green-far)"
            opacity="0.65"
          />
          <path
            d="M0,255 C150,215 350,240 550,228 C750,214 950,244 1200,232 L1200,380 L0,380 Z"
            fill="var(--postal-green-mid)"
            opacity="0.75"
          />
          {/* Dirt path */}
          <path
            d="M0,298 Q300,285 500,292 Q700,298 900,288 Q1050,280 1200,290"
            fill="none"
            stroke="var(--postal-path)"
            strokeWidth="6"
            opacity="0.5"
          />
          <path
            d="M0,300 C100,285 300,295 500,290 C700,284 900,298 1200,292 L1200,380 L0,380 Z"
            fill="var(--postal-green-near)"
          />

          {/* Collection Boxes
              Each box is 96 wide × 130 tall.
              The outer <g> carries the static SVG translate so that motion.g
              only needs to animate scale — no coordinate conflict. */}
          {STAGES.map((s, i) => {
            const cx = (s.mailboxX / 100) * 1200;
            const bx = cx - 48;
            const by = 298 - 130; // ground line y≈298, box is 130 tall
            const isActive = stage === i + 1;
            const isPassed = stage > i + 1;

            return (
              <g key={i} transform={`translate(${bx}, ${by})`}>
                <motion.g
                  animate={{
                    scale: isActive ? 1.1 : 1.0,
                    // Use the resolved hex — CSS variables are not interpolatable
                    // by the browser animation engine.
                    filter: isActive
                      ? `drop-shadow(0 0 12px ${POSTAL_BLUE_HEX})`
                      : "drop-shadow(0 0 0px rgba(0,0,0,0))",
                  }}
                  transition={{ duration: 0.5, ease: EASE }}
                  style={{
                    // transform-box: fill-box makes transform-origin relative
                    // to the element's own bounding box, not the SVG viewport.
                    transformBox: "fill-box" as never,
                    transformOrigin: "center",
                  }}
                >
                  <CollectionBox
                    active={isActive}
                    passed={isPassed}
                    label={s.label}
                  />
                </motion.g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Status card — top center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6 px-4"
              style={{
                background: "rgba(253,246,227,0.85)",
                backdropFilter: "blur(6px)",
              }}
            >
              <p
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                }}
              >
                Unable to Trace Post
              </p>
              <p
                className="text-sm text-center max-w-md"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-muted)",
                }}
              >
                {error}
              </p>
              <button
                className="text-xs tracking-widest uppercase px-6 py-2"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-muted)",
                  border: "1px solid var(--postal-ink-muted)",
                  background: "var(--postal-paper)",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
                onClick={onReset}
              >
                Try Another Post
              </button>

              {failedReport?.markdown && (
                <div className="w-full mt-2 text-left">
                  <p
                    className="mb-1.5 text-[9px] tracking-widest uppercase"
                    style={{ color: "var(--postal-ink-muted)" }}
                  >
                    Result from Jina Reader
                  </p>
                  <pre
                    className="text-[10px] leading-relaxed whitespace-pre-wrap overflow-y-auto"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: "var(--postal-ink-muted)",
                      background: "rgba(0,0,0,0.03)",
                      border: "1px dashed var(--postal-ink-muted)",
                      padding: "0.75rem",
                      maxHeight: "150px",
                    }}
                  >
                    {failedReport.markdown}
                  </pre>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={stageLabel}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="px-5 py-3 rounded-[2px] text-center"
              style={{
                background: "rgba(253,246,227,0.9)",
                border: "1px solid var(--postal-ink-muted)",
                backdropFilter: "blur(4px)",
              }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase mb-0.5"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-muted)",
                }}
              >
                {stageLabel}
              </p>
              <p
                className="text-sm italic"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                }}
              >
                {stageDetail}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
