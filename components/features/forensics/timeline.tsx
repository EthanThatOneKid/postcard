import {
  MapPin,
  Search,
  Clock,
  Fingerprint,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { Corroboration } from "@/src/lib/postcard";

interface TimelineNodeProps {
  icon: React.ReactNode;
  label: string;
  isLast?: boolean;
  children: React.ReactNode;
}

export function TimelineNode({
  icon,
  label,
  isLast = false,
  children,
}: TimelineNodeProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="flex shrink-0 items-center justify-center rounded-none"
          style={{
            width: "28px",
            height: "28px",
            background: "var(--postal-paper-2)",
            border: "1px solid var(--postal-ink-muted)",
          }}
        >
          {icon}
        </div>
        {!isLast && (
          <div
            className="mt-1 flex-1 border-l-2 border-dashed"
            style={{
              borderColor: "var(--postal-ink-muted)",
              minHeight: "28px",
            }}
          />
        )}
      </div>
      <div className="flex-1 pb-6 last:pb-0">
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

function CitationText({ text }: { text: string }) {
  // Matches [[N]](url)
  const parts = text.split(/(\[\[\d+\]\]\(https?:\/\/[^\)]+\))/g);

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[\[(\d+)\]\]\((https?:\/\/[^\)]+)\)/);
        if (match) {
          const [, n, url] = match;
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-w-[14px] h-[14px] px-0.5 text-[8px] font-bold rounded-sm mx-0.5 align-top transition-colors hover:bg-[var(--postal-blue)] hover:text-white"
              style={{
                background: "var(--postal-blue-faint)",
                color: "var(--postal-blue)",
                border: "1px solid var(--postal-blue-faint)",
              }}
            >
              {n}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

interface TimelineProps {
  triangulation: {
    targetUrl?: string;
    queries: string[];
  };
  corroboration: Corroboration;
  audit: {
    originScore: number;
    temporalScore: number;
    auditLog: string[];
  };
}

export function TravelTimeline({
  triangulation,
  corroboration,
  audit,
}: TimelineProps) {
  const hasTargetUrl =
    triangulation.targetUrl !== null && triangulation.targetUrl !== undefined;

  return (
    <>
      <TimelineNode
        icon={<MapPin size={13} style={{ color: "var(--postal-ink-muted)" }} />}
        label="Origin"
      >
        {hasTargetUrl ? (
          <a
            href={triangulation.targetUrl ?? ""}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-sm underline underline-offset-2"
            style={{ color: "var(--postal-blue)" }}
          >
            {triangulation.targetUrl}
          </a>
        ) : (
          <p
            className="text-sm italic"
            style={{ color: "var(--postal-ink-muted)" }}
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
                  border: "1px solid var(--postal-ink-muted)",
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
        icon={<Search size={13} className="text-[var(--postal-ink-muted)]" />}
        label="Triangulation Path"
      >
        <div className="flex flex-col gap-4">
          <div
            className="p-3 text-[11px] italic leading-relaxed"
            style={{
              background: "var(--postal-paper-3)",
              border: "1px solid var(--postal-ink-muted)",
              color: "var(--postal-ink)",
              borderLeft: "2px solid var(--postal-blue)",
            }}
          >
            &ldquo;
            <CitationText text={corroboration.summary} />
            &rdquo;
          </div>

          {corroboration.primarySources.length > 0 && (
            <div className="flex flex-col gap-3">
              {corroboration.primarySources.map(
                (
                  source: Corroboration["primarySources"][number],
                  i: number,
                ) => (
                  <SourceCard key={i} source={source} index={i} />
                ),
              )}
            </div>
          )}

          {corroboration.queriesExecuted.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {corroboration.queriesExecuted.map(
                (q: Corroboration["queriesExecuted"][number], i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-1 text-[9px]"
                    style={{
                      background: "var(--postal-paper-3)",
                      border: "1px dashed var(--postal-ink-muted)",
                      color: "var(--postal-ink-muted)",
                    }}
                  >
                    <Search size={10} />
                    {q.query}
                    <span style={{ color: "var(--postal-ink-muted)" }}>
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
        icon={<Search size={13} className="text-[var(--postal-ink-muted)]" />}
        label="Corroboration Trace"
      >
        <div className="flex flex-col gap-1.5">
          {corroboration.corroborationLog.map((entry: string, i: number) => (
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
          ))}
        </div>
      </TimelineNode>

      <TimelineNode
        icon={<Clock size={13} style={{ color: "var(--postal-ink-muted)" }} />}
        label="Audit Trail"
      >
        <div className="flex flex-col gap-1.5">
          {audit.auditLog.map((entry: string, i: number) => {
            const parsed = parseAuditJson(entry);
            return (
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
                {parsed ? (
                  <AuditJsonEntry data={parsed} />
                ) : (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--postal-ink)" }}
                  >
                    {entry}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </TimelineNode>

      <TimelineNode
        icon={
          <Fingerprint size={13} className="text-[var(--postal-ink-muted)]" />
        }
        label="Forensic Breakdown"
        isLast
      >
        <div className="grid grid-cols-2 gap-4">
          <ScoreGauge label="Origin" value={audit.originScore} delay={0.9} />
          <ScoreGauge
            label="Temporal"
            value={audit.temporalScore}
            delay={1.0}
          />
        </div>
        <p
          className="mt-2 text-[9px] tracking-wide"
          style={{ color: "var(--postal-ink-muted)" }}
        >
          Score = 0.5 · Origin + 0.5 · Temporal
        </p>
      </TimelineNode>
    </>
  );
}

interface AuditVerificationStep {
  details: string;
  status: "success" | "failure" | string;
}

interface AuditLogFields {
  url_verification?: AuditVerificationStep;
  timestamp_alignment?: AuditVerificationStep;
  ui_elements_match?: AuditVerificationStep;
}


function parseAuditJson(entry: string): AuditLogFields | null {
  const match = entry.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]);
    if (data && typeof data === "object" && "audit_log" in data) {
      return data.audit_log as AuditLogFields;
    }
    return null;
  } catch {
    return null;
  }
}

const STEP_LABELS: Record<keyof AuditLogFields, string> = {
  url_verification: "URL Verification",
  timestamp_alignment: "Timestamp Alignment",
  ui_elements_match: "UI Elements Match",
};

function AuditJsonEntry({ data }: { data: AuditLogFields }) {
  const steps = (Object.keys(STEP_LABELS) as (keyof AuditLogFields)[]).filter(
    (key) => data[key] !== undefined,
  );

  return (
    <div
      className="flex-1 flex flex-col gap-1.5 p-2"
      style={{
        background: "var(--postal-paper-2)",
        border: "1px solid var(--postal-ink-muted)",
      }}
    >
      {steps.map((key) => {
        const step = data[key]!;
        const isSuccess = step.status === "success";
        const statusColor = isSuccess
          ? "var(--postal-green-near)"
          : "var(--postal-red)";
        const statusBg = isSuccess
          ? "var(--postal-green-faint)"
          : "var(--postal-red-faint)";

        return (
          <div key={key} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[9px] tracking-widest uppercase"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-blue)",
                }}
              >
                {STEP_LABELS[key]}
              </span>
              <span
                className="shrink-0 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-tighter"
                style={{
                  background: statusBg,
                  color: statusColor,
                  border: "1px solid currentColor",
                }}
              >
                {step.status}
              </span>
            </div>
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: "var(--postal-ink-muted)" }}
            >
              {step.details}
            </p>
          </div>
        );
      })}
    </div>
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
  const color =
    value >= 0.9
      ? "var(--postal-green-near)"
      : value >= 0.5
        ? "var(--postal-amber)"
        : "var(--postal-red)";

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
        <div
          className="h-full rounded-none"
          style={{
            background: color,
            width: `${pct}%`,
            transition: `width 1s ease ${delay}s`,
          }}
        />
      </div>
    </div>
  );
}

import { motion } from "motion/react";

function SourceCard({
  source,
  index,
}: {
  source: Corroboration["primarySources"][number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.1 }}
      className="flex flex-col gap-1.5 p-3"
      style={{
        background: "var(--postal-paper-2)",
        border: "1px solid var(--postal-ink-muted)",
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
              style={{ color: "var(--postal-ink-muted)" }}
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
            <ShieldCheck size={10} className="fill-current" />
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
  );
}
