"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PLACEHOLDER_URLS = [
  "https://x.com/user/status/1234567890",
  "https://twitter.com/user/status/1234567890",
  "https://bsky.app/profile/user.bsky.social/post/abc123",
  "https://www.instagram.com/p/ABC123/",
  "https://www.reddit.com/r/programming/comments/abc123/",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://threads.net/@user/post/1234567890",
] as const;

/* ── SVG paper airplane ───────────────────────────── */
function PaperPlane({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points="0,32 120,8 82,32"
        fill="var(--postal-paper)"
        stroke="var(--postal-ink-muted)"
        strokeWidth="0.8"
      />
      <polygon
        points="0,32 82,32 52,52"
        fill="var(--postal-paper-2)"
        stroke="var(--postal-ink-muted)"
        strokeWidth="0.8"
      />
      <line
        x1="0"
        y1="32"
        x2="82"
        y2="32"
        stroke="var(--postal-ink-muted)"
        strokeWidth="0.7"
      />
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

function AnimatedPlaceholder() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PLACEHOLDER_URLS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          textAlign: "center",
        }}
      >
        {PLACEHOLDER_URLS[index]}
      </motion.span>
    </AnimatePresence>
  );
}

/* ── Airmail animation overlay ────────────────────── */

type AnimStage = "envelope" | "folding" | "airplane" | "flying";

function AirmailAnimation({
  postUrl,
  onComplete,
}: {
  postUrl: string;
  onComplete: () => void;
}) {
  const [stage, setStage] = useState<AnimStage>("envelope");

  useEffect(() => {
    const t1 = setTimeout(() => setStage("folding"), 1800);
    const t2 = setTimeout(() => setStage("airplane"), 2800);
    const t3 = setTimeout(() => setStage("flying"), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, var(--postal-sky) 0%, var(--postal-paper) 100%)",
      }}
    >
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
              border: "2px solid var(--postal-ink-muted)",
            }}
          >
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

            <div className="absolute inset-3 mt-3 mb-3 flex items-center justify-center overflow-hidden rounded-[2px]">
              <span
                className="text-xs truncate px-2"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink)",
                }}
              >
                {postUrl}
              </span>
            </div>

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

            <div
              className="absolute bottom-5 left-5 text-[9px] tracking-[0.25em] uppercase"
              style={{
                color: "var(--postal-ink-muted)",
                fontFamily: "var(--font-serif)",
              }}
            >
              URL Submitted
            </div>
          </motion.div>
        )}

        {stage === "folding" && (
          <motion.div
            key="folding"
            initial={{ scaleY: 0.08, opacity: 0.5 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0, rotateZ: 15 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative"
          >
            <div
              className="w-64 h-32 rounded-sm shadow-xl flex items-center justify-center"
              style={{
                background: "var(--postal-paper-2)",
                border: "1px solid var(--postal-ink-muted)",
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
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(
                    135deg,
                    transparent 48%,
                    var(--postal-ink-muted) 49%,
                    var(--postal-ink-muted) 51%,
                    transparent 52%
                  )`,
                  opacity: 0.4,
                }}
              />
            </div>
          </motion.div>
        )}

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

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs italic text-center"
        style={{
          color: "var(--postal-ink-muted)",
          fontFamily: "var(--font-serif)",
        }}
      >
        Dispatching your URL via airmail…
      </div>
    </div>
  );
}

/* ── URL Input Card ───────────────────────────── */

export function DropZone({
  onUrlSubmitted,
}: {
  onUrlSubmitted: (url: string) => void;
}) {
  const [animating, setAnimating] = useState(false);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(async (url: string) => {
    if (!url.trim()) {
      toast.error("Please enter a post URL.");
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL.");
      return;
    }
    setPostUrl(url);
    setAnimating(true);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    if (postUrl) {
      onUrlSubmitted(postUrl);
    }
  }, [postUrl, onUrlSubmitted]);

  return (
    <>
      <AnimatePresence>
        {animating && postUrl && (
          <AirmailAnimation
            postUrl={postUrl}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      <section
        className="w-full px-6 pb-20 pt-4"
        style={{ background: "var(--postal-paper)" }}
      >
        <div className="mx-auto max-w-xl">
          <div className="text-center mb-6">
            <h2
              className="text-2xl font-semibold italic mb-1"
              style={{
                fontFamily: "var(--font-display), serif",
                color: "var(--postal-ink)",
              }}
            >
              Submit Your Post URL
            </h2>
            <p
              className="text-sm"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--postal-ink-muted)",
                fontStyle: "italic",
              }}
            >
              Enter the URL of the social media post you wish to trace.
            </p>
          </div>

          <div
            className="relative"
            style={{
              boxShadow: `0 0 0 3px var(--postal-paper), 0 0 0 5px var(--postal-ink-muted), 0 4px 16px rgba(44,36,22,0.1)`,
              borderRadius: "2px",
              background: "var(--postal-paper)",
            }}
            role="region"
            aria-label="Post URL input"
          >
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

            <div className="m-6 flex flex-col items-center">
              <label htmlFor="post-url-input" className="sr-only">
                Post URL
              </label>
              <div
                className="relative w-full max-w-sm"
                style={{
                  background: "var(--postal-paper-2)",
                  border: "1px solid var(--postal-ink-muted)",
                  borderRadius: "2px",
                }}
              >
                <input
                  id="post-url-input"
                  ref={inputRef}
                  type="url"
                  placeholder="https://x.com/user/status/1234567890"
                  aria-label="Enter social media post URL"
                  className="w-full px-4 py-3 text-sm text-center bg-transparent"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink)",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    setIsFocused(true);
                    e.currentTarget.style.borderColor = "var(--postal-ink)";
                  }}
                  onBlur={(e) => {
                    setIsFocused(false);
                    e.currentTarget.style.borderColor =
                      "var(--postal-ink-muted)";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit(e.currentTarget.value);
                    }
                  }}
                />
                {!isFocused && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      background: "var(--postal-paper-2)",
                      borderRadius: "2px",
                    }}
                    aria-hidden="true"
                  >
                    <AnimatedPlaceholder />
                  </div>
                )}
              </div>

              <button
                type="button"
                className="mt-4 px-6 py-2 text-sm transition-all duration-150"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-paper)",
                  background: "var(--postal-ink)",
                  border: "1px solid var(--postal-ink)",
                  borderRadius: "2px",
                  letterSpacing: "0.04em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--postal-ink-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--postal-ink)";
                }}
                onClick={() => {
                  const url = inputRef.current?.value ?? "";
                  handleSubmit(url);
                }}
              >
                Trace Post
              </button>

              <p
                className="mt-5 text-xs tracking-widest uppercase"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-ink-muted)",
                }}
              >
                x.com &nbsp;·&nbsp; bluesky.app &nbsp;·&nbsp; threads.net
              </p>
            </div>

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
        </div>
      </section>
    </>
  );
}
