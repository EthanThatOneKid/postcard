import { motion } from "motion/react";
import { Clock, Fingerprint, ShieldCheck } from "lucide-react";
import { CancelStamp } from "@/components/illustrations";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

export function ScoreGauge({
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

export function MetaStamp({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
      style={{
        border: "1px solid var(--postal-ink-muted)",
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

export function ScoreDisplay({
  score,
  displayPct,
  isVerified,
  reason,
}: {
  score: number;
  displayPct: number;
  isVerified: boolean;
  reason?: string;
}) {
  const color = scoreColor(score);
  const verdict = scoreVerdict(score);

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center px-12 py-7"
      style={{
        background: "var(--postal-paper-2)",
        border: "2px solid var(--postal-ink-muted)",
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
          style={{ color: "var(--postal-ink-muted)", fontWeight: 400 }}
        >
          /100
        </span>
      </p>
      <p
        className="mt-1.5 text-sm font-semibold tracking-wide"
        style={{ color }}
      >
        {verdict}
      </p>
      {reason && (
        <p
          className="mt-2 max-w-[280px] text-center text-[10px] leading-relaxed italic opacity-80"
          style={{ color: "var(--postal-ink)" }}
        >
          &ldquo;{reason}&rdquo;
        </p>
      )}
    </div>
  );
}

export function MetaStamps({
  platform,
  timestampText,
  username,
}: {
  platform: string;
  timestampText?: string;
  username?: string;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <MetaStamp
        icon={
          <ShieldCheck size={11} className="text-[var(--postal-ink-muted)]" />
        }
        text={platform}
      />
      {timestampText && (
        <MetaStamp
          icon={<Clock size={11} className="text-[var(--postal-ink-muted)]" />}
          text={timestampText}
        />
      )}
      {username && (
        <MetaStamp
          icon={
            <Fingerprint size={11} className="text-[var(--postal-ink-muted)]" />
          }
          text={username}
        />
      )}
    </div>
  );
}
