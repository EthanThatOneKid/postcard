"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Hero, DropZone, AnalysisJourney } from "@/components/features/landing";
import { ForensicReport } from "@/components/features/forensics";
import type { PostcardReport } from "@/src/lib/postcard";
import { normalizePostUrl } from "@/src/lib/url";

type PageStage = "upload" | "analyzing" | "results";

interface PostcardStatus {
  postcardId: string;
  status: "processing" | "completed" | "failed";
  stage?: string;
  message?: string;
  progress?: number;
  error?: string;
  [key: string]: unknown;
}

interface Props {
  initialUrl: string | null;
  initialReport: PostcardReport | null;
  processingUrl: string | null;
}

export default function PostcardsClient({
  initialUrl,
  initialReport,
  processingUrl,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isForcedRefresh = useMemo(
    () => searchParams.get("forceRefresh") === "true",
    [searchParams],
  );

  const [report, setReport] = useState<PostcardReport | null>(initialReport);
  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  const postUrl = processingUrl || initialUrl;
  const forceRefresh = isForcedRefresh;

  const [postcardStatus, setPostcardStatus] = useState<PostcardStatus | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback((url: string, _postcardId?: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/postcards?url=${encodeURIComponent(url)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setPostcardStatus(data);

          if (data.status === "completed" || data.status === "failed") {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  }, []);

  useEffect(() => {
    if (processingUrl && !report && !postcardStatus) {
      startPolling(processingUrl);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [processingUrl, report, postcardStatus, startPolling]);

  const pageStage: PageStage = useMemo(() => {
    if (report) return "results";
    if (postUrl && (postcardStatus?.status === "processing" || isSubmitting))
      return "analyzing";
    if (postUrl && postcardStatus?.status === "failed") return "results";
    if (postUrl) return "analyzing";
    return "upload";
  }, [report, postUrl, postcardStatus, isSubmitting]);

  const handleUrlSubmitted = useCallback(
    (url: string) => {
      const normalized = normalizePostUrl(url);
      router.push(
        `/postcards?url=${encodeURIComponent(normalized)}&forceRefresh=true`,
      );
    },
    [router],
  );

  const handleReportReady = useCallback((r: PostcardReport) => {
    setReport(r);
  }, []);

  const handleReset = useCallback(() => {
    setReport(null);
    setPostcardStatus(null);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    router.push("/postcards");
  }, [router]);

  if (pageStage === "analyzing" && postUrl) {
    return (
      <AnalysisJourney
        postUrl={postUrl}
        postcardStatus={postcardStatus}
        onComplete={handleReportReady}
        onReset={handleReset}
        onSubmit={handleUrlSubmitted}
      />
    );
  }

  if (
    pageStage === "results" &&
    (report || postcardStatus?.status === "failed")
  ) {
    return (
      <ForensicReport
        report={
          report || {
            postcard: { platform: "Other", mainText: "" },
            markdown: "",
            triangulation: { targetUrl: postUrl || "", queries: [] },
            audit: {
              originScore: 0,
              temporalScore: 0,
              totalScore: 0,
              auditLog: [],
            },
            corroboration: {
              primarySources: [],
              queriesExecuted: [],
              verdict: "insufficient_data",
              summary: postcardStatus?.error || "Analysis failed",
              confidenceScore: 0,
              corroborationLog: [],
            },
            timestamp: new Date().toISOString(),
          }
        }
      />
    );
  }

  return (
    <main>
      <Hero />
      <DropZone onUrlSubmitted={handleUrlSubmitted} />
    </main>
  );
}
