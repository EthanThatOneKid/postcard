"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Hero, DropZone, AnalysisJourney } from "@/components/features/landing";
import { ForensicReport } from "@/components/features/forensics";
import type { PostcardReport } from "@/src/api/schemas";
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
  shouldReplay?: boolean;
}

export default function PostcardsClient({
  initialUrl,
  initialReport,
  processingUrl,
  shouldReplay = false,
}: Props) {
  const router = useRouter();

  const isReplay = shouldReplay;

  const [report, setReport] = useState<PostcardReport | null>(
    isReplay ? null : initialReport,
  );

  useEffect(() => {
    if (!isReplay) {
      setReport(initialReport);
    }
  }, [initialReport, isReplay]);

  const postUrl = processingUrl || initialUrl;
  const [postcardStatus, setPostcardStatus] = useState<PostcardStatus | null>(
    null,
  );
  const [mockStatus, setMockStatus] = useState<PostcardStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Mock processing for "Dry Rerun" (replay)
  useEffect(() => {
    if (isReplay && initialReport && !report) {
      const stages = [
        {
          stage: "scraping",
          message: "Re-fetching post content...",
          progress: 0.2,
        },
        {
          stage: "corroborating",
          message: "Searching for primary sources...",
          progress: 0.5,
        },
        {
          stage: "auditing",
          message: "Verifying origin and temporal alignment...",
          progress: 0.8,
        },
        { stage: "complete", message: "Postcard complete", progress: 1 },
      ];

      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < stages.length) {
          const s = stages[currentIdx];
          setMockStatus({
            postcardId: initialReport.id || "replay",
            status: s.stage === "complete" ? "completed" : "processing",
            ...s,
            postcard: initialReport.postcard,
            markdown: initialReport.markdown,
            triangulation: initialReport.triangulation,
            audit: initialReport.audit,
            corroboration: initialReport.corroboration,
            timestamp: initialReport.timestamp,
            id: initialReport.id,
          });
          currentIdx++;
        } else {
          clearInterval(interval);
          setReport(initialReport);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isReplay, initialReport, report]);

  const startPolling = useCallback((url: string) => {
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
    // If we're performing a real analysis (processingUrl), ALWAYS poll
    // regardless of isReplay. This ensures the DB result is updated.
    if (processingUrl && !report && !postcardStatus) {
      startPolling(processingUrl);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [processingUrl, report, postcardStatus, startPolling]);

  const currentStatus = isReplay ? mockStatus : postcardStatus;

  const pageStage: PageStage = useMemo(() => {
    if (report) return "results";
    if (
      postUrl &&
      (currentStatus?.status === "processing" || isSubmitting || isReplay)
    )
      return "analyzing";
    if (postUrl && currentStatus?.status === "failed") return "results";
    if (postUrl) return "analyzing";
    return "upload";
  }, [report, postUrl, currentStatus, isSubmitting, isReplay]);

  const handleUrlSubmitted = useCallback(
    (url: string) => {
      const normalized = normalizePostUrl(url);
      setIsSubmitting(true);
      router.push(
        `/postcards?url=${encodeURIComponent(normalized)}&refresh=true`,
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
    setMockStatus(null);
    setIsSubmitting(false);
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
        postcardStatus={currentStatus}
        onComplete={handleReportReady}
        onReset={handleReset}
        onSubmit={handleUrlSubmitted}
      />
    );
  }

  if (
    pageStage === "results" &&
    (report || currentStatus?.status === "failed")
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
              summary: currentStatus?.error || "Analysis failed",
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
      <Hero>
        <DropZone onUrlSubmitted={handleUrlSubmitted} />
      </Hero>
    </main>
  );
}
