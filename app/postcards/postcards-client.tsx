"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Hero, DropZone, AnalysisJourney } from "@/components/features/landing";
import { ForensicReport } from "@/components/features/forensics";
import type { PostcardReport } from "@/src/lib/postcard";
import { normalizePostUrl } from "@/src/lib/url";

type PageStage = "upload" | "analyzing" | "results";

interface JobStatus {
  jobId: string;
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

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback((url: string, jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/postcards?url=${encodeURIComponent(url)}`,
        );
        if (response.ok) {
          const data = await response.json();
          setJobStatus(data);

          if (data.status === "completed") {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            if (data.postcard && data.markdown) {
              const completeReport: PostcardReport = {
                postcard: data.postcard,
                markdown: data.markdown,
                triangulation: data.triangulation,
                audit: data.audit,
                corroboration: data.corroboration,
                timestamp: data.timestamp,
                analysisId: data.analysisId,
              };
              setReport(completeReport);
            }
          } else if (data.status === "failed") {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 3000);
  }, []);

  const submitUrl = useCallback(
    async (url: string) => {
      setIsSubmitting(true);
      try {
        const response = await fetch("/api/postcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, forceRefresh: true }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.jobId) {
            startPolling(url, data.jobId);
          }
        }
      } catch (err) {
        console.error("Submit error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [forceRefresh, startPolling],
  );

  useEffect(() => {
    if (processingUrl && !report && !jobStatus) {
      startPolling(processingUrl, "");
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [processingUrl, report, jobStatus, startPolling]);

  const pageStage: PageStage = useMemo(() => {
    if (report) return "results";
    if (postUrl && (jobStatus?.status === "processing" || isSubmitting))
      return "analyzing";
    if (postUrl && jobStatus?.status === "failed") return "results";
    if (postUrl) return "analyzing";
    return "upload";
  }, [report, postUrl, jobStatus, isSubmitting]);

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
    setJobStatus(null);
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
        jobStatus={jobStatus}
        onComplete={handleReportReady}
        onReset={handleReset}
        onSubmit={submitUrl}
      />
    );
  }

  if (pageStage === "results" && (report || jobStatus?.status === "failed")) {
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
              summary: jobStatus?.error || "Analysis failed",
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
