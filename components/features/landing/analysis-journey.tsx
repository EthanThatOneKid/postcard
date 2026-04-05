"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { PostcardReport } from "@/src/lib/postcard";
import { PaperPlane, Cloud } from "@/components/illustrations";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

function Mailbox({
  active,
  passed,
  stageIndex,
}: {
  active: boolean;
  passed: boolean;
  stageIndex: number;
}) {
  const label = STAGES[stageIndex];
  return (
    <g className={active ? "mailbox-glowing" : ""}>
      <rect
        x="18"
        y="44"
        width="4"
        height="22"
        rx="1"
        fill="var(--postal-green-dark)"
      />
      <rect
        x="4"
        y="26"
        width="32"
        height="20"
        rx="3"
        fill={passed ? "var(--postal-red)" : "#8b6340"}
      />
      <rect
        x="10"
        y="32"
        width="20"
        height="3"
        rx="1.5"
        fill="rgba(0,0,0,0.25)"
      />
      {passed && (
        <g style={{ animation: "flag-raise 0.4s ease-out both" }}>
          <rect x="36" y="18" width="2" height="12" fill="#c8a060" />
          <polygon points="38,18 38,26 46,22" fill="var(--postal-red)" />
        </g>
      )}
      {active && (
        <circle
          cx="20"
          cy="18"
          r="4"
          fill="var(--postal-amber)"
          opacity="0.9"
        />
      )}
      {(active || passed) && (
        <text
          x="20"
          y="14"
          textAnchor="middle"
          fontSize="7"
          fill={active ? "var(--postal-amber)" : "var(--postal-ink-muted)"}
          fontFamily="var(--font-serif), serif"
          fontStyle="italic"
        >
          {label.label}
        </text>
      )}
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
  analysisId?: string;
}

interface AnalysisJourneyProps {
  postUrl: string;
  postcardStatus: PostcardStatus | null;
  onComplete: (report: PostcardReport) => void;
  onReset: () => void;
  onSubmit: (url: string) => void;
}

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
          analysisId: postcardStatus.analysisId,
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
          lastStatusRef.current = currentStatus;
          return;
        }

        setTimeout(() => {
          onCompleteRef.current(report);
        }, 800);
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
  }, [postcardStatus]);

  const planeX =
    stage === 0
      ? -60
      : stage === 1
        ? 220
        : stage === 2
          ? 500
          : stage === 3
            ? 780
            : 1300;
  const planeY = stage === 0 ? 160 : 150;

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
      <div className="absolute inset-x-0" style={{ top: "15%" }}>
        <svg
          viewBox="0 0 1200 320"
          className="w-full"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
        >
          <Cloud cx={100} cy={40} scale={1.1} delay={0} />
          <Cloud cx={450} cy={20} scale={0.8} delay={3} />
          <Cloud cx={800} cy={50} scale={1.0} delay={6} />
          <Cloud cx={1050} cy={25} scale={0.7} delay={2} />
          <Cloud cx={280} cy={70} scale={0.55} delay={9} />

          <path
            d="M0,200 C200,140 400,175 600,155 C800,130 1000,168 1200,150 L1200,320 L0,320 Z"
            fill="var(--postal-green-far)"
            opacity="0.65"
          />
          <path
            d="M0,235 C150,195 350,220 550,208 C750,194 950,224 1200,212 L1200,320 L0,320 Z"
            fill="var(--postal-green-mid)"
            opacity="0.75"
          />
          <path
            d="M0,278 Q300,265 500,272 Q700,278 900,268 Q1050,260 1200,270"
            fill="none"
            stroke="var(--postal-path)"
            strokeWidth="5"
            opacity="0.5"
          />
          <path
            d="M0,280 C100,265 300,275 500,270 C700,264 900,278 1200,272 L1200,320 L0,320 Z"
            fill="var(--postal-green-near)"
          />

          {STAGES.map((s, i) => (
            <g
              key={i}
              transform={`translate(${(s.mailboxX / 100) * 1200 - 20}, 240)`}
            >
              <Mailbox
                stageIndex={i}
                active={stage === i + 1}
                passed={stage > i + 1 || stage === i + 1}
              />
            </g>
          ))}
        </svg>
      </div>

      <motion.div
        className="absolute pointer-events-none"
        style={{ top: "18%" }}
        animate={{
          left: `${((planeX + 60) / 1200) * 100}%`,
          y: planeY - 150,
        }}
        transition={{
          duration: stage === 0 ? 0 : 2.4,
          ease: EASE,
        }}
      >
        <div
          style={{
            animation:
              stage < 4 ? "plane-bob 2.5s ease-in-out infinite" : "none",
          }}
        >
          <PaperPlane className="w-24 h-auto drop-shadow-md" />
        </div>
      </motion.div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
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
          )}

          {!error && (
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
