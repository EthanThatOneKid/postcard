"use client";

import { useState, useCallback } from "react";
import { Hero } from "@/components/ui/Hero";
import { DropZone } from "@/components/ui/DropZone";
import { AnalysisJourney } from "@/components/ui/AnalysisJourney";

type PageStage = "upload" | "analyzing";

export default function PostcardHome() {
  const [pageStage, setPageStage] = useState<PageStage>("upload");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);

  const handleFileSubmitted = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setEvidenceUrl(url);
    setPageStage("analyzing");
  }, []);

  if (pageStage === "analyzing" && evidenceUrl) {
    return <AnalysisJourney imageUrl={evidenceUrl} />;
  }

  return (
    <main>
      <Hero />
      <DropZone onFileSubmitted={handleFileSubmitted} />
    </main>
  );
}
