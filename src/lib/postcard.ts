import { z } from "zod";
import { preprocessImage } from "./vision/processor";
import { extractPostmark } from "./vision/ocr";
import { navigateToSource } from "./agents/navigator";
import { auditPostmark } from "./agents/verifier";
import { corroboratePostmark } from "./agents/corroborator";

export const CorroborationSchema = z.object({
  primarySources: z.array(
    z.object({
      url: z.string().url(),
      title: z.string(),
      source: z.string(),
      snippet: z.string(),
      relevance: z.enum(["supporting", "refuting", "neutral"]),
      publishedDate: z.string().optional(),
    }),
  ),
  queriesExecuted: z.array(
    z.object({
      query: z.string(),
      sourcesFound: z.number(),
    }),
  ),
  verdict: z.enum([
    "verified",
    "disputed",
    "inconclusive",
    "insufficient_data",
  ]),
  summary: z.string(),
  confidenceScore: z.number().min(0).max(1),
  corroborationLog: z.array(z.string()),
});

export type Corroboration = z.infer<typeof CorroborationSchema>;

export const PostcardReportSchema = z.object({
  ocr: z.object({
    markdown: z.string(),
    postmark: z.object({
      username: z.string().optional(),
      timestampText: z.string().optional(),
      platform: z.string(),
      engagement: z.record(z.string(), z.string()).optional(),
      mainText: z.string(),
      uiAnchors: z
        .array(
          z.object({
            element: z.string(),
            position: z.string(),
            confidence: z.number(),
          }),
        )
        .optional(),
    }),
  }),
  triangulation: z.object({
    targetUrl: z.string().url().optional(),
    queries: z.array(z.string()),
  }),
  audit: z.object({
    originScore: z.number(),
    temporalScore: z.number(),
    visualScore: z.number(),
    totalScore: z.number(),
    auditLog: z.array(z.string()),
  }),
  corroboration: CorroborationSchema,
  timestamp: z.string().datetime(),
});

export type PostcardReport = z.infer<typeof PostcardReportSchema>;

// ---------------------------------------------------------------------------
// Mock report — returned immediately when NEXT_PUBLIC_MOCK_PIPELINE=true.
// Lets you exercise the full UI flow (animations, Travel Log, Postmark Score)
// without spending any API quota.
// ---------------------------------------------------------------------------
const MOCK_REPORT: PostcardReport = {
  ocr: {
    markdown:
      "## @YeOldeTweeter\n**Breaking: local man discovers that water is, in fact, wet.**\n*14h ago · 3.2K Retweets · 21.4K Likes*",
    postmark: {
      username: "@YeOldeTweeter",
      timestampText: "14h ago",
      platform: "X",
      engagement: { likes: "21.4K", retweets: "3.2K", views: "812K" },
      mainText: "Breaking: local man discovers that water is, in fact, wet.",
      uiAnchors: [
        {
          element: "verified-badge",
          position: "next-to-username",
          confidence: 0.97,
        },
        { element: "x-logo", position: "top-left", confidence: 0.99 },
      ],
    },
  },
  triangulation: {
    targetUrl: "https://x.com/YeOldeTweeter/status/1800000000000000001",
    queries: [
      'site:x.com @YeOldeTweeter "water is wet" 14h ago',
      'YeOldeTweeter "local man discovers" tweet X',
    ],
  },
  audit: {
    originScore: 1,
    temporalScore: 0.9,
    visualScore: 0.9,
    totalScore: 0.94,
    auditLog: [
      "[MOCK] Starting audit for URL: https://x.com/YeOldeTweeter/status/1800000000000000001",
      "[MOCK] URL verified: Direct match found.",
      "[MOCK] Temporal match: Timestamp consistent with live page content.",
      "[MOCK] Visual consistency: UI fingerprints align with X platform template.",
    ],
  },
  corroboration: {
    primarySources: [
      {
        url: "https://www.nytimes.com/2025/01/15/science/water-wet-discovery.html",
        title: "Local Man Makes Historic Discovery: Water Is Wet",
        source: "nytimes.com",
        snippet: "In what experts are calling a breakthrough moment...",
        relevance: "supporting",
        publishedDate: "2025-01-15",
      },
      {
        url: "https://apnews.com/article/water-wet-discovery-abc123",
        title: "AP Investigates: The Wetness of Water",
        source: "apnews.com",
        snippet: "Scientists confirm what many suspected...",
        relevance: "supporting",
        publishedDate: "2025-01-16",
      },
    ],
    queriesExecuted: [
      { query: 'site:nytimes.com "water is wet" local man', sourcesFound: 2 },
      { query: "site:apnews.com water wet discovery", sourcesFound: 1 },
    ],
    verdict: "verified",
    summary:
      "Found 2 corroborating sources from trusted domains. Content appears verified.",
    confidenceScore: 0.85,
    corroborationLog: [
      "[MOCK] Starting corroboration for X post by @YeOldeTweeter",
      '[MOCK] Executing search query 1/5: site:nytimes.com "water is wet" local man...',
      "[MOCK] Found 2 results",
      "[MOCK] Corroboration complete: 2 sources found, 2 from trusted domains",
    ],
  },
  timestamp: new Date().toISOString(),
};

export async function processPostcard(
  imageBuffer: Buffer,
  mimeType: string = "image/png",
): Promise<PostcardReport> {
  // Short-circuit with mock data when quota is exhausted or during UI testing.
  if (process.env.NEXT_PUBLIC_MOCK_PIPELINE === "true") {
    return { ...MOCK_REPORT, timestamp: new Date().toISOString() };
  }

  // 1. Preprocess — resize to ≤1024px, normalize contrast + sharpness for OCR accuracy
  const processed = await preprocessImage(imageBuffer, {
    contrast: 1.2,
    sharpen: true,
  });

  // 2. OCR + Postmark extraction via Gemini 1.5 Flash vision
  const ocr = await extractPostmark(processed, mimeType);

  // 3. Throttle — avoid hitting the RPM cap between back-to-back Gemini calls
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 4. Navigator Agent — triangulate the source URL via Google Search grounding
  const { url: targetUrl, queries } = await navigateToSource(
    ocr.postmark,
    ocr.markdown,
  );

  // 5. Forensic Audit — Playwright scrapes the live page and computes scores
  //    Skip if no URL was found by the navigator
  const audit = targetUrl
    ? await auditPostmark(targetUrl, ocr.postmark)
    : {
        originScore: 0,
        temporalScore: 0,
        visualScore: 0,
        totalScore: 0,
        auditLog: ["Skipping audit: No target URL identified by navigator."],
      };

  // 6. Primary Source Corroboration — AI SDK agent loop with Google Dorking
  //    Uses trusted domain allowlist to find corroborating or refuting sources
  const corroboration = await corroboratePostmark(ocr.postmark, ocr.markdown);

  return PostcardReportSchema.parse({
    ocr,
    triangulation: { targetUrl, queries },
    audit,
    corroboration,
    timestamp: new Date().toISOString(),
  });
}
