"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getApiKeyCookie, setApiKeyCookie } from "@/src/lib/api-key-cookie";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ApiKeyDialogProps {
  open: boolean;
  onKeySubmitted: (key: string) => void;
  onCancel: () => void;
}

/**
 * A postal-themed dialog that asks the user for their Gemini API key
 * before proceeding with analysis. The key is stored in a browser
 * cookie and never persisted to the database.
 */
export function ApiKeyDialog({
  open,
  onKeySubmitted,
  onCancel,
}: ApiKeyDialogProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  // Pre-fill from cookie if available
  useEffect(() => {
    if (open) {
      const stored = getApiKeyCookie();
      const timeoutId = setTimeout(() => {
        if (stored) setKey(stored);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  const handleSubmit = useCallback(() => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError("Please enter your API key.");
      return;
    }
    if (!trimmed.startsWith("AIza")) {
      setError("That doesn't look like a Google AI API key.");
      return;
    }
    setApiKeyCookie(trimmed);
    setError("");
    onKeySubmitted(trimmed);
  }, [key, onKeySubmitted]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(44,36,22,0.55)" }}
            onClick={onCancel}
          />

          {/* Dialog card */}
          <motion.div
            className="relative w-full max-w-md mx-4"
            style={{
              background: "var(--postal-paper)",
              border: "1px solid var(--postal-ink-muted)",
              boxShadow: "0 12px 48px rgba(44,36,22,0.25)",
            }}
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {/* Airmail stripe */}
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

            <div className="px-8 py-7 flex flex-col gap-5">
              {/* Title */}
              <div>
                <h2
                  className="text-base tracking-[0.2em] uppercase mb-2"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--postal-ink)",
                  }}
                >
                  API Key Required
                </h2>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink)",
                  }}
                >
                  Postcard uses Google Gemini to power its forensic analysis.
                  Enter your API key to begin tracing.
                </p>
              </div>

              {/* Security notice */}
              <div
                className="flex items-start gap-3 px-4 py-3"
                style={{
                  background: "var(--postal-paper-2)",
                  border: "1px solid var(--postal-ink-muted)",
                }}
              >
                <span
                  className="text-sm mt-0.5"
                  style={{ color: "var(--postal-green-near)" }}
                >
                  🔒
                </span>
                <p
                  className="text-xs leading-relaxed"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink-muted)",
                  }}
                >
                  Your key is stored <strong>only in your browser</strong> as a
                  cookie and is never persisted to our database. It is used
                  exclusively for AI-powered forensic requests.
                </p>
              </div>

              {/* Input */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="api-key-input"
                  className="text-[11px] tracking-[0.3em] uppercase"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink-muted)",
                  }}
                >
                  Google AI API Key
                </label>
                <input
                  id="api-key-input"
                  type="password"
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="AIza..."
                  className="w-full h-11 px-3 text-sm bg-transparent"
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    color: "var(--postal-ink)",
                    border: "1px solid var(--postal-ink-muted)",
                    borderRadius: 0,
                    outline: "none",
                  }}
                  autoFocus
                />
                {error && (
                  <p
                    className="text-xs"
                    style={{
                      fontFamily: "var(--font-serif)",
                      color: "var(--postal-red)",
                    }}
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* Get a key link */}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--postal-blue)",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Get a free API key from Google AI Studio ↗
              </a>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  className="flex-1 py-2.5 text-sm tracking-widest uppercase transition-colors duration-150"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-paper)",
                    background: "var(--postal-ink)",
                    border: "1px solid var(--postal-ink)",
                    borderRadius: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--postal-ink-muted)";
                    e.currentTarget.style.borderColor =
                      "var(--postal-ink-muted)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--postal-ink)";
                    e.currentTarget.style.borderColor = "var(--postal-ink)";
                  }}
                  onClick={handleSubmit}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 text-sm tracking-widest uppercase transition-colors duration-150"
                  style={{
                    fontFamily: "var(--font-serif)",
                    color: "var(--postal-ink-muted)",
                    background: "transparent",
                    border: "1px solid var(--postal-ink-muted)",
                    borderRadius: 0,
                  }}
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Bottom airmail stripe */}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
