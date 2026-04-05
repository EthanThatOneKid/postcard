"use client";

import { useState, useCallback } from "react";
import { Hero } from "@/components/ui/Hero";
import { DropZone } from "@/components/ui/DropZone";
import { AnalysisJourney } from "@/components/ui/AnalysisJourney";
import { ForensicReport } from "@/src/components/forensics/forensic-report";
import type { PostcardReport } from "@/src/lib/postcard";

type PageStage = "upload" | "analyzing" | "results";

export default function PostcardHome() {
  const [pageStage, setPageStage] = useState<PageStage>("upload");
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const [report, setReport] = useState<PostcardReport | null>(null);

  const handleUrlSubmitted = useCallback((url: string) => {
    setPostUrl(url);
    setReport(null);
    setPageStage("analyzing");
  }, []);

  const handleReportReady = useCallback((r: PostcardReport) => {
    setReport(r);
    setPageStage("results");
  }, []);

  const handleReset = useCallback(() => {
    setPostUrl(null);
    setReport(null);
    setPageStage("upload");
  }, []);

  if (pageStage === "analyzing" && postUrl) {
    return (
      <AnalysisJourney
        postUrl={postUrl}
        onComplete={handleReportReady}
        onReset={handleReset}
      />
    );
  }

  if (pageStage === "results" && report) {
    return <ForensicReport report={report} />;
  }

  return (
    <main>
      <Hero />
      <DropZone onUrlSubmitted={handleUrlSubmitted} />
    </main>
  );
}
