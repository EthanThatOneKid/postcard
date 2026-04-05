"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Hero, LandingHook, DropZone } from "@/components/features/landing";
import { Footer } from "@/components/ui/footer";
import { normalizePostUrl } from "@/src/lib/url";

const AIRMAIL_BG = `repeating-linear-gradient(
  -45deg,
  var(--postal-red)   0px  8px,
  var(--postal-paper) 8px 10px,
  var(--postal-blue) 10px 18px,
  var(--postal-paper) 18px 20px
)`;

export default function Home() {
  const router = useRouter();

  const handleUrlSubmitted = useCallback(
    (url: string) => {
      const normalized = normalizePostUrl(url);
      router.push(`/postcards?url=${encodeURIComponent(normalized)}`);
    },
    [router],
  );

  return (
    <main>
      {/* Primary hero — URL submission form lives in the sky */}
      <Hero>
        <DropZone onUrlSubmitted={handleUrlSubmitted} />
      </Hero>

      {/* Airmail stripe — sharp visual separator between hero and features */}
      <div
        className="h-2"
        style={{ backgroundImage: AIRMAIL_BG }}
        aria-hidden="true"
      />

      {/* Feature marketing section */}
      <LandingHook />

      <Footer />
    </main>
  );
}
