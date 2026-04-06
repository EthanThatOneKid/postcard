"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Hero,
  DropZone,
  AnalysisJourney,
  ApiKeyDialog,
} from "@/components/features/landing";
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
  needsApiKey?: boolean;
}

export default function PostcardsClient({
  initialUrl,
  initialReport,
  processingUrl,
  shouldReplay = false,
  needsApiKey = false,
}: Props) {
  const router = useRouter();

  const isReplay = shouldReplay;

  const [report, setReport] = useState<PostcardReport | null>(
    isReplay ? null : initialReport,
  );

  useEffect(() => {
    if (!isReplay) {
      const timeoutId = setTimeout(() => {
        setReport(initialReport);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [initialReport, isReplay]);

  const postUrl = processingUrl || initialUrl;
  const [postcardStatus, setPostcardStatus] = useState<PostcardStatus | null>(
    null,
  );
  const [mockStatus, setMockStatus] = useState<PostcardStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // API key dialog — shown when the server tells us a key is needed
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(needsApiKey);

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

  /**
   * Submit a URL for analysis. Navigates to the SSR page with
   * refresh=true. The server reads the API key from the cookie
   * and auto-starts the pipeline.
   */
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

  /**
   * Called when the user submits their API key from the dialog.
   * Sets the cookie, then refreshes the page so the server
   * can read it and auto-start the pipeline.
   */
  const handleApiKeySubmitted = useCallback(() => {
    setShowApiKeyDialog(false);
    // Refresh the current page — the server will now find the
    // cookie and start the analysis.
    router.refresh();
  }, [router]);

  const handleApiKeyCancel = useCallback(() => {
    setShowApiKeyDialog(false);
    router.push("/postcards");
  }, [router]);

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

  // API key dialog overlay — shown in any stage if the server says we need a key
  const apiKeyOverlay = (
    <ApiKeyDialog
      open={showApiKeyDialog}
      onKeySubmitted={handleApiKeySubmitted}
      onCancel={handleApiKeyCancel}
    />
  );

  if (pageStage === "analyzing" && postUrl) {
    return (
      <>
        {apiKeyOverlay}
        <AnalysisJourney
          postUrl={postUrl}
          postcardStatus={currentStatus}
          onComplete={handleReportReady}
          onReset={handleReset}
          onSubmit={handleUrlSubmitted}
        />
      </>
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
    <>
      {apiKeyOverlay}
      <main>
        <Hero>
          <DropZone onUrlSubmitted={handleUrlSubmitted} />
        </Hero>
      </main>
    </>
  );
}
