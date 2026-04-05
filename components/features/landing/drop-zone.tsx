"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PaperPlane } from "@/components/illustrations";

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
        className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none px-3"
        style={{ color: "var(--postal-ink-muted)" }}
      >
        <span
          className="truncate text-sm"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {PLACEHOLDER_URLS[index]}
        </span>
      </motion.span>
    </AnimatePresence>
  );
}

// ── Airmail animation overlay (full-screen, fixed) ─────────────────────────

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
            className="relative w-80 h-52 shadow-2xl overflow-hidden"
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

            <div className="absolute inset-3 mt-3 mb-3 flex items-center justify-center overflow-hidden">
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
                className="w-5 h-5 border-2"
                style={{
                  borderColor: "var(--postal-red)",
                  borderRadius: "50%",
                }}
              />
              <div
                className="w-5 h-5 border-2"
                style={{
                  borderColor: "var(--postal-blue)",
                  borderRadius: "50%",
                }}
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
              className="w-64 h-32 shadow-xl flex items-center justify-center"
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

// ── DropZone ───────────────────────────────────────────────────────────────
// Renders as a compact, grounded input panel — no outer section wrapper.
// Designed to be embedded inside <Hero> as children, sitting on the green field.

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
      {/* Full-screen airmail dispatch animation overlay */}
      <AnimatePresence>
        {animating && postUrl && (
          <AirmailAnimation
            postUrl={postUrl}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      {/* Grounded input panel */}
      <div
        className="w-full max-w-md"
        style={{
          background: "var(--postal-paper-2)",
          border: "1px solid var(--postal-ink-muted)",
          boxShadow: "0 8px 32px rgba(44,36,22,0.18)",
        }}
        role="region"
        aria-label="Post URL submission"
      >
        {/* Airmail accent stripe — visual separator at panel top */}
        <div
          className="h-2"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              var(--postal-red) 0px, var(--postal-red) 4px,
              transparent 4px, transparent 8px,
              var(--postal-blue) 8px, var(--postal-blue) 12px,
              transparent 12px, transparent 16px
            )`,
          }}
        />

        <div className="px-8 py-6 flex flex-col items-center gap-4">
          {/* Section label — postal uppercase pattern */}
          <p
            className="text-[11px] tracking-[0.35em] uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
            }}
          >
            Submit a Post URL
          </p>

          {/* URL input */}
          <div className="relative w-full">
            <label htmlFor="post-url-input" className="sr-only">
              Post URL
            </label>
            <input
              id="post-url-input"
              ref={inputRef}
              type="url"
              aria-label="Enter social media post URL"
              className="w-full h-11 px-3 text-sm text-center bg-transparent"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--postal-ink)",
                border: "1px solid var(--postal-ink-muted)",
                borderRadius: 0,
                outline: "none",
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(e.currentTarget.value);
              }}
            />
            {/* Animated URL placeholder — only visible when input is unfocused and empty */}
            {!isFocused && <AnimatedPlaceholder />}
          </div>

          {/* Submit button — solid, high-contrast */}
          <button
            type="button"
            className="w-full py-2.5 text-sm tracking-widest uppercase transition-colors duration-150"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-paper)",
              background: "var(--postal-ink)",
              border: "1px solid var(--postal-ink)",
              borderRadius: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--postal-ink-muted)";
              e.currentTarget.style.borderColor = "var(--postal-ink-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--postal-ink)";
              e.currentTarget.style.borderColor = "var(--postal-ink)";
            }}
            onClick={() => handleSubmit(inputRef.current?.value ?? "")}
          >
            Trace Post
          </button>

          {/* Supported platforms */}
          <p
            className="text-[10px] tracking-widest uppercase"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--postal-ink-muted)",
            }}
          >
            x.com &nbsp;·&nbsp; bluesky &nbsp;·&nbsp; threads &nbsp;·&nbsp;
            reddit
          </p>
        </div>
      </div>
    </>
  );
}
