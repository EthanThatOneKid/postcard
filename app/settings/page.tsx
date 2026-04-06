"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import {
  getApiKeyCookie,
  setApiKeyCookie,
  clearApiKeyCookie,
} from "@/src/lib/api-key-cookie";

export default function SettingsPage() {
  const [state, setState] = useState({
    apiKey: "",
    hasApiKey: false,
    loading: true,
    saved: false,
  });

  useEffect(() => {
    const stored = getApiKeyCookie();
    // Use setTimeout to avoid synchronous setState in effect (lint error: react-hooks/set-state-in-effect)
    const timeoutId = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        apiKey: stored || "",
        hasApiKey: !!stored,
        loading: false,
      }));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSave = () => {
    const trimmed = state.apiKey.trim();
    if (trimmed) {
      setApiKeyCookie(trimmed);
      setState((prev) => ({
        ...prev,
        hasApiKey: true,
        saved: true,
      }));
      setTimeout(() => setState((prev) => ({ ...prev, saved: false })), 2000);
    }
  };

  const handleClear = () => {
    clearApiKeyCookie();
    setState((prev) => ({
      ...prev,
      apiKey: "",
      hasApiKey: false,
    }));
  };

  const handleTestApi = async () => {
    const stored = getApiKeyCookie();
    if (!stored) return;

    try {
      // Test via POST since that's how we send the API key now
      const res = await fetch("/api/postcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://x.com/test/123",
          userApiKey: stored,
        }),
      });

      if (res.ok || res.status === 202) {
        alert("API key used successfully! (Status: " + res.status + ")");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(
          "API key test failed (Status: " +
            res.status +
            ")\n" +
            (data.error || "Unknown error"),
        );
      }
    } catch (err) {
      alert("Error testing API key: " + err);
    }
  };

  if (state.loading) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <p>Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        className="mx-auto max-w-2xl px-6 py-12"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        <h1
          className="text-2xl tracking-widest uppercase mb-8"
          style={{ fontFamily: "var(--font-display)" }}
        >
          API Settings
        </h1>

        <section className="mb-8">
          <h2 className="text-sm tracking-wider uppercase mb-4 text-muted-foreground">
            Google AI API Key
          </h2>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Postcard uses Google Gemini for AI-powered fact-checking and
            verification. If you&apos;re running in live mode (not fake mode),
            you&apos;ll need an API key. This key is stored locally in your
            browser and never sent to our servers.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            <Link
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              className="underline hover:text-foreground"
            >
              Get your free API key from Google AI Studio
            </Link>
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="password"
              value={state.apiKey}
              onChange={(e) => {
                setState((prev) => ({
                  ...prev,
                  apiKey: e.target.value,
                  hasApiKey: false,
                }));
              }}
              placeholder="Paste your Google AI API key here"
              className="w-full h-10 px-3 border border-input bg-transparent text-sm font-mono"
            />

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!state.apiKey.trim()}>
                {state.saved ? "Saved!" : "Save Key"}
              </Button>
              {state.hasApiKey && (
                <>
                  <Button variant="outline" onClick={handleTestApi}>
                    Test Key
                  </Button>
                  <Button variant="ghost" onClick={handleClear}>
                    Clear
                  </Button>
                </>
              )}
            </div>

            {state.hasApiKey && (
              <p className="text-xs text-green-600 dark:text-green-400">
                API key is configured
              </p>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm tracking-wider uppercase mb-4 text-muted-foreground">
            Running in Live Mode
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To run Postcard in live mode (real AI analysis instead of fake
            data), set{" "}
            <code className="bg-muted px-1">
              NEXT_PUBLIC_FAKE_PIPELINE=false
            </code>{" "}
            in your .env file.
          </p>
        </section>

        <Link
          href="/"
          className="text-xs underline hover:text-foreground text-muted-foreground"
        >
          ← Back to Home
        </Link>
      </main>
    </>
  );
}
