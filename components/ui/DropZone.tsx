"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTS = ".jpg,.jpeg,.png,.webp";

/* ── SVG paper airplane ───────────────────────────── */
function PaperPlane({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main upper wing */}
      <polygon
        points="0,32 120,8 82,32"
        fill="var(--postal-paper)"
        stroke="var(--postal-ink-faint)"
        strokeWidth="0.8"
      />
      {/* Lower fold */}
      <polygon
        points="0,32 82,32 52,52"
        fill="var(--postal-paper-2)"
        stroke="var(--postal-ink-faint)"
        strokeWidth="0.8"
      />
      {/* Fold crease */}
      <line
        x1="0"
        y1="32"
        x2="82"
        y2="32"
        stroke="var(--postal-ink-faint)"
        strokeWidth="0.7"
      />
      {/* Hint of airmail stripe on wing */}
      <line
        x1="30"
        y1="20"
        x2="75"
        y2="14"
        stroke="var(--postal-red)"
        strokeWidth="1"
        opacity="0.35"
      />
      <line
        x1="30"
        y1="24"
        x2="75"
        y2="18"
        stroke="var(--postal-blue)"
        strokeWidth="1"
        opacity="0.35"
      />
    </svg>
  );
}

/* ── Airmail animation overlay ────────────────────── */

type AnimStage = "envelope" | "folding" | "airplane" | "flying";

function AirmailAnimation({
  imageUrl,
  onComplete,
}: {
  imageUrl: string;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<AnimStage>("envelope");

  // Progress through stages automatically
  useState(() => {
    const t1 = setTimeout(() => setStage("folding"), 1800);
    const t2 = setTimeout(() => setStage("airplane"), 2800);
    const t3 = setTimeout(() => setStage("flying"), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, var(--postal-sky) 0%, var(--postal-paper) 100%)",
      }}
    >
      {/* Subtle clouds behind */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        viewBox="0 0 1200 800"
        aria-hidden
      >
        <g
          style={{
            animation: "cloud-drift 14s ease-in-out infinite alternate",
          }}
        >
          <ellipse cx="200" cy="150" rx="80" ry="45" fill="white" />
          <ellipse cx="260" cy="130" rx="60" ry="40" fill="white" />
        </g>
        <g
          style={{
            animation: "cloud-drift-slow 18s ease-in-out infinite alternate",
          }}
        >
          <ellipse cx="900" cy="200" rx="70" ry="38" fill="white" />
          <ellipse cx="960" cy="180" rx="50" ry="32" fill="white" />
        </g>
      </svg>

      <AnimatePresence mode="wait">
        {/* Stage 1: Envelope */}
        {stage === "envelope" && (
          <motion.div
            key="envelope"
            initial={{ scale: 0, opacity: 0, rotateZ: -8 }}
            animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
            exit={{ scaleY: 0.08, opacity: 0, rotateX: 90 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative w-80 h-52 rounded-sm shadow-2xl overflow-hidden"
            style={{
              background: "var(--postal-paper)",
              border: "2px solid var(--postal-ink-faint)",
            }}
          >
            {/* Airmail diagonal border */}
            <div
              className="absolute inset-x-0 top-0 h-3"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  var(--postal-red) 0px, var(--postal-red) 5px,
                  transparent 5px, transparent 10px,
                  var(--postal-blue) 10px, var(--postal-blue) 15px,
                  transparent 15px, transparent 20px
                )`,
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-3"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  var(--postal-red) 0px, var(--postal-red) 5px,
                  transparent 5px, transparent 10px,
                  var(--postal-blue) 10px, var(--postal-blue) 15px,
                  transparent 15px, transparent 20px
                )`,
              }}
            />
            <div
              className="absolute inset-y-0 left-0 w-3"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  180deg,
                  var(--postal-red) 0px, var(--postal-red) 5px,
                  transparent 5px, transparent 10px,
                  var(--postal-blue) 10px, var(--postal-blue) 15px,
                  transparent 15px, transparent 20px
                )`,
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-3"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  180deg,
                  var(--postal-red) 0px, var(--postal-red) 5px,
                  transparent 5px, transparent 10px,
                  var(--postal-blue) 10px, var(--postal-blue) 15px,
                  transparent 15px, transparent 20px
                )`,
              }}
            />

            {/* Image inside */}
            <div className="absolute inset-3 mt-3 mb-3 overflow-hidden rounded-[2px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Evidence"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Corner stamp circles */}
            <div className="absolute top-4 right-4 flex gap-1">
              <div
                className="w-5 h-5 rounded-full border-2"
                style={{ borderColor: "var(--postal-red)" }}
              />
              <div
                className="w-5 h-5 rounded-full border-2"
                style={{ borderColor: "var(--postal-blue)" }}
              />
            </div>

            {/* Label */}
            <div
              className="absolute bottom-5 left-5 text-[9px] tracking-[0.25em] uppercase"
              style={{
                color: "var(--postal-ink-muted)",
                fontFamily: "var(--font-serif)",
              }}
            >
              Evidence Submitted
            </div>
          </motion.div>
        )}

        {/* Stage 2: Folding */}
        {stage === "folding" && (
          <motion.div
            key="folding"
            initial={{ scaleY: 0.08, opacity: 0.5 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0, rotateZ: 15 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative"
          >
            {/* Folded paper / transition shape */}
            <div
              className="w-64 h-32 rounded-sm shadow-xl flex items-center justify-center"
              style={{
                background: "var(--postal-paper-2)",
                border: "1px solid var(--postal-ink-faint)",
                perspective: "400px",
              }}
            >
              <span
                className="text-xs italic"
                style={{
                  color: "var(--postal-ink-muted)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                Folding…
              </span>
              {/* Fold crease lines */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(
                    135deg,
                    transparent 48%,
                    var(--postal-ink-faint) 49%,
                    var(--postal-ink-faint) 51%,
                    transparent 52%
                  )`,
                  opacity: 0.4,
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Stage 3: Airplane revealed */}
        {stage === "airplane" && (
          <motion.div
            key="airplane"
            initial={{ scale: 0.4, opacity: 0, rotateZ: 20 }}
            animate={{ scale: 1, opacity: 1, rotateZ: -8 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <PaperPlane className="w-52 h-auto drop-shadow-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 4: Flying off screen */}
      <AnimatePresence>
        {stage === "flying" && (
          <motion.div
            key="flying"
            className="absolute"
            style={{ top: "45%", left: "35%" }}
            initial={{ x: 0, y: 0, rotateZ: -8, scale: 1, opacity: 1 }}
            animate={{
              x: "180vw",
              y: "-120vh",
              rotateZ: -18,
              scale: 0.18,
              opacity: 0,
            }}
            transition={{
              duration: 2.6,
              ease: [0.4, 0, 0.6, 1] as [number, number, number, number],
            }}
            onAnimationComplete={onComplete}
          >
            <PaperPlane className="w-48 h-auto" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom caption */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs italic text-center"
        style={{
          color: "var(--postal-ink-muted)",
          fontFamily: "var(--font-serif)",
        }}
      >
        Dispatching your evidence via airmail…
      </div>
    </div>
  );
}

/* ── Stamp perforated drop zone ───────────────────── */

export function DropZone({
  onFileSubmitted,
}: {
  onFileSubmitted: (file: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please submit a .jpg, .png, or .webp image.");
      return;
    }
    setError(null);
    try {
      const bytes = await file.bytes();
      const base64 = bytes.toBase64();
      setImageUrl(`data:${file.type};base64,${base64}`);
      setAnimating(true);
    } catch (err) {
      console.error("File intake failure:", err);
      setError("Data extraction failed. Please re-upload.");
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);
  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );
  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleAnimationComplete = useCallback(() => {
    if (imageUrl) {
      // Convert back to File via fetch for the callback
      fetch(imageUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const f = new File([blob], "evidence.jpg", { type: blob.type });
          onFileSubmitted(f);
        });
    }
  }, [imageUrl, onFileSubmitted]);

  return (
    <>
      {/* Animation overlay */}
      <AnimatePresence>
        {animating && imageUrl && (
          <AirmailAnimation
            imageUrl={imageUrl}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      {/* Drop zone card */}
      <section
        className="w-full px-6 pb-20 pt-4"
        style={{ background: "var(--postal-paper)" }}
      >
        <div className="mx-auto max-w-xl">
          {/* Section heading */}
          <div className="text-center mb-6">
            <h2
              className="text-2xl font-semibold italic mb-1"
              style={{
                fontFamily: "var(--font-display), serif",
                color: "var(--postal-ink)",
              }}
            >
              Submit Your Evidence
            </h2>
            <p
              className="text-sm"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--postal-ink-muted)",
                fontStyle: "italic",
              }}
            >
              Drop a screenshot of the social media post you wish to trace.
            </p>
          </div>

          {/* Stamp card */}
          <div
            className="relative cursor-pointer transition-all duration-200"
            style={{
              /* Stamp perforations: outer shadow dots */
              boxShadow: dragOver
                ? `0 0 0 3px var(--postal-paper), 0 0 0 5px var(--postal-red), 0 8px 32px rgba(44,36,22,0.18)`
                : `0 0 0 3px var(--postal-paper), 0 0 0 5px var(--postal-ink-faint), 0 4px 16px rgba(44,36,22,0.1)`,
              borderRadius: "2px",
              background: dragOver ? "#fff8ef" : "var(--postal-paper)",
            }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            aria-label="Drop evidence image or click to browse"
          >
            {/* Airmail top stripe */}
            <div
              className="h-3 rounded-t-[2px]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  var(--postal-red) 0px, var(--postal-red) 6px,
                  transparent 6px, transparent 12px,
                  var(--postal-blue) 12px, var(--postal-blue) 18px,
                  transparent 18px, transparent 24px
                )`,
              }}
            />

            {/* Interior dashed area */}
            <div
              className="m-4 flex flex-col items-center justify-center py-12 rounded-[1px]"
              style={{
                border: `2px dashed ${dragOver ? "var(--postal-red)" : "var(--postal-ink-faint)"}`,
                transition: "border-color 0.2s",
              }}
            >
              {/* Upload icon — envelope with arrow */}
              <div className="mb-5">
                <svg viewBox="0 0 48 48" className="w-12 h-12" fill="none">
                  <rect
                    x="4"
                    y="12"
                    width="40"
                    height="28"
                    rx="2"
                    fill="var(--postal-paper-2)"
                    stroke={
                      dragOver ? "var(--postal-red)" : "var(--postal-ink-faint)"
                    }
                    strokeWidth="2"
                    style={{ transition: "stroke 0.2s" }}
                  />
                  <polyline
                    points="4,14 24,28 44,14"
                    stroke={
                      dragOver ? "var(--postal-red)" : "var(--postal-ink-faint)"
                    }
                    strokeWidth="2"
                    style={{ transition: "stroke 0.2s" }}
                  />
                  {/* Up arrow */}
                  <line
                    x1="24"
                    y1="38"
                    x2="24"
                    y2="28"
                    stroke="var(--postal-red)"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                  <polyline
                    points="19,33 24,28 29,33"
                    stroke="var(--postal-red)"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <p
                className="text-base mb-1"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                  fontStyle: "italic",
                }}
              >
                {dragOver ? "Release to dispatch" : "Drop your screenshot here"}
              </p>
              <p
                className="text-sm mb-5"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-muted)",
                }}
              >
                or
              </p>

              {/* Browse button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="px-6 py-2 text-sm transition-all duration-150"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                  background: "var(--postal-paper-2)",
                  border: "1px solid var(--postal-ink-faint)",
                  borderRadius: "2px",
                  letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--postal-paper-3)";
                  e.currentTarget.style.borderColor = "var(--postal-ink-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--postal-paper-2)";
                  e.currentTarget.style.borderColor = "var(--postal-ink-faint)";
                }}
              >
                Browse Files
              </button>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTS}
                className="hidden"
                onChange={onFileChange}
              />

              <p
                className="mt-5 text-xs tracking-widest uppercase"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-faint)",
                }}
              >
                .jpg &nbsp;·&nbsp; .png &nbsp;·&nbsp; .webp
              </p>
            </div>

            {/* Airmail bottom stripe */}
            <div
              className="h-3 rounded-b-[2px]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  var(--postal-red) 0px, var(--postal-red) 6px,
                  transparent 6px, transparent 12px,
                  var(--postal-blue) 12px, var(--postal-blue) 18px,
                  transparent 18px, transparent 24px
                )`,
              }}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-center italic"
                style={{
                  color: "var(--postal-red)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
