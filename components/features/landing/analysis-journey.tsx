"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { PostcardReport } from "@/src/lib/postcard";
import { Cloud } from "@/components/illustrations";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_OUT: [number, number, number, number] = [0.0, 0.0, 0.3, 1.0];

// Resolved hex — CSS variables are not interpolatable by the browser animation engine.
const POSTAL_BLUE_HEX = "#2464a0";

export type AnalysisStage = 0 | 1 | 2 | 3 | 4;

interface StageInfo {
  label: string;
  detail: string;
  /** Horizontal position as a percentage of the SVG viewBox width (0-100). */
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

const BOX_TOP_Y = 168; // 298 (ground) − 130 (box height)
const PLANE_HOVER_Y = BOX_TOP_Y - 40 - 25; // 103 — plane bottom sits 25 SVG-units above box top

const PLANE_TARGETS: Record<AnalysisStage, { x: number; y: number }> = {
  0: { x: -110, y: PLANE_HOVER_Y }, // off-screen left, same altitude
  1: { x: 0.22 * 1200 - 40, y: PLANE_HOVER_Y }, // 224
  2: { x: 0.5 * 1200 - 40, y: PLANE_HOVER_Y }, // 560
  3: { x: 0.78 * 1200 - 40, y: PLANE_HOVER_Y }, // 896
  4: { x: 1380, y: PLANE_HOVER_Y - 65 }, // fly away right + up
};

// ── Inline plane shape (scaled from viewBox 0 0 120 60 → 80×40 SVG units) ─
function PlaneShape() {
  return (
    <g transform="scale(0.667)">
      <polygon
        points="0,32 120,8 82,32"
        fill="var(--postal-paper)"
        stroke="var(--postal-ink-muted)"
        strokeWidth="1.2"
      />
      <polygon
        points="0,32 82,32 52,52"
        fill="var(--postal-paper-2)"
        stroke="var(--postal-ink-muted)"
        strokeWidth="1.2"
      />
      <line
        x1="0"
        y1="32"
        x2="82"
        y2="32"
        stroke="var(--postal-ink-muted)"
        strokeWidth="1"
      />
      <line
        x1="30"
        y1="20"
        x2="75"
        y2="14"
        stroke="var(--postal-red)"
        strokeWidth="1.5"
        opacity="0.4"
      />
      <line
        x1="30"
        y1="24"
        x2="75"
        y2="18"
        stroke="var(--postal-blue)"
        strokeWidth="1.5"
        opacity="0.4"
      />
    </g>
  );
}

interface PostcardStatus {
  postcardId: string;
  status: "processing" | "completed" | "failed";
  stage?: string;
  message?: string;
  progress?: number;
  error?: string;
  postcard?: unknown;
  markdown?: string;
  triangulation?: unknown;
  audit?: unknown;
  corroboration?: unknown;
  timestamp?: string;
  id?: string;
}

// ── USPS-style collection box ───────────────────────────────────────────────
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

      {/* Top highlight */}
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

      {/* Status panel */}
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

      {/* Left bevel */}
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

interface AnalysisJourneyProps {
  postUrl: string;
  postcardStatus: PostcardStatus | null;
  onComplete: (report: PostcardReport) => void;
  onReset: () => void;
  onSubmit: (url: string) => void;
}

// ── AnalysisJourney ─────────────────────────────────────────────────────────
export function AnalysisJourney({
  postUrl,
  postcardStatus,
  onComplete,
  onReset,
  onSubmit,
}: AnalysisJourneyProps) {
  const [stage, setStage] = useState<AnalysisStage>(0);
  const [stageLabel, setStageLabel] = useState("Dispatched");
  const [stageDetail, setStageDetail] = useState("Evidence en route…");
  const [error, setError] = useState<string | null>(null);
  const [failedReport, setFailedReport] = useState<PostcardReport | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onResetRef = useRef(onReset);
  const onSubmitRef = useRef(onSubmit);
  const hasSubmittedRef = useRef(false);
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    if (!hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      onSubmitRef.current(postUrl);
    }
  }, [postUrl]);

  useEffect(() => {
    const originalTitle = document.title;
    if (error) {
      document.title = "Analysis Failed | Postcard";
    } else {
      document.title = `${stageLabel} | Postcard`;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [stageLabel, error]);

  useEffect(() => {
    if (!postcardStatus) return;

    const currentStatus = postcardStatus.status;

    if (currentStatus === "failed") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(postcardStatus.error ?? "Analysis failed");
      return;
    }

    if (
      currentStatus === "completed" &&
      lastStatusRef.current !== "completed"
    ) {
      if (postcardStatus.postcard && postcardStatus.markdown) {
        const report: PostcardReport = {
          postcard: postcardStatus.postcard as PostcardReport["postcard"],
          markdown: postcardStatus.markdown,
          triangulation:
            postcardStatus.triangulation as PostcardReport["triangulation"],
          audit: postcardStatus.audit as PostcardReport["audit"],
          corroboration:
            postcardStatus.corroboration as PostcardReport["corroboration"],
          timestamp: postcardStatus.timestamp ?? new Date().toISOString(),
          id: postcardStatus.id,
        };

        const hasContent = !!(
          report.markdown && report.markdown.trim().length > 50
        );

        if (
          report.corroboration.verdict === "insufficient_data" &&
          !hasContent
        ) {
          setError(
            report.corroboration.summary ??
              "Unable to locate the linked content. The URL may be inaccessible or require authentication.",
          );
          setFailedReport(report);
          setStage(4);
          lastStatusRef.current = currentStatus;
          return;
        }

        setStage(4);
        setStageLabel("Complete");
        setStageDetail("Evidence authenticated.");

        setTimeout(() => {
          onCompleteRef.current(report);
        }, 1200);
      }
      lastStatusRef.current = currentStatus;
      return;
    }

    if (currentStatus === "processing") {
      const { stage: serverStage, message, progress: pct } = postcardStatus;

      setStageLabel(
        serverStage === "starting"
          ? "Dispatched"
          : (serverStage ?? "Processing"),
      );
      setStageDetail(message ?? "Analyzing...");

      const pctNum = typeof pct === "number" ? pct : 0;
      if (pctNum < 0.33) setStage(1);
      else if (pctNum < 0.66) setStage(2);
      else if (pctNum < 1) setStage(3);
      else setStage(4);
    }

    lastStatusRef.current = currentStatus;
  }, [postcardStatus, error]);

  const planeTarget = PLANE_TARGETS[stage];

  return (
    // height: clamp(440px, 38vw, 560px) tracks the SVG's natural aspect ratio
    // (viewBox 1200×380 starting at top:15%) so there is no dead gradient below the hills.
    <div
      className="w-full relative overflow-hidden"
      style={{
        height: "clamp(440px, 38vw, 560px)",
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
      {/* Status card ── absolute overlay in the sky zone */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-6 px-4 py-8"
              style={{
                background: "rgba(253,246,227,0.85)",
                backdropFilter: "blur(6px)",
                border: "1px solid var(--postal-red)",
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
                  borderRadius: 0,
                  cursor: "pointer",
                }}
                onClick={() => onResetRef.current()}
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
              className="px-5 py-3 text-center"
              style={{
                background: "rgba(253,246,227,0.9)",
                border: "1px solid var(--postal-ink-muted)",
                backdropFilter: "blur(4px)",
                borderRadius: 0,
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

      {/* Landscape SVG ── everything in one coordinate system */}
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

          {/* Animated paper plane */}
          <motion.g
            animate={{ x: planeTarget.x, y: planeTarget.y }}
            transition={{ duration: 1.1, ease: EASE_OUT }}
          >
            <motion.g
              animate={stage < 4 ? { y: [0, -10, 0] } : { y: 0 }}
              transition={
                stage < 4
                  ? {
                      duration: 2.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatType: "loop",
                    }
                  : { duration: 0.3 }
              }
            >
              <PlaneShape />
            </motion.g>
          </motion.g>

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

          {/* Collection Boxes */}
          {STAGES.map((s, i) => {
            const cx = (s.mailboxX / 100) * 1200;
            const bx = cx - 48;
            const by = 298 - 130;
            const isActive = stage === i + 1;
            const isPassed = stage > i + 1;

            return (
              <g key={i} transform={`translate(${bx}, ${by})`}>
                <motion.g
                  animate={{
                    scale: isActive ? 1.1 : 1.0,
                    filter: isActive
                      ? `drop-shadow(0 0 12px ${POSTAL_BLUE_HEX})`
                      : "drop-shadow(0 0 0px rgba(0,0,0,0))",
                  }}
                  transition={{ duration: 0.5, ease: EASE }}
                  style={{
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
    </div>
  );
}
