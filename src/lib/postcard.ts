import { z } from "zod";
import { db } from "@/db";
import { analyses, posts } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { corroboratePostcard } from "./agents/corroborator";
import { auditPostcard } from "./agents/verifier";
import { unifiedPostClient } from "./ingest";
import { normalizePostUrl } from "./url";

export type ProgressCallback = (
  stage: string,
  message: string,
  progress: number,
) => void;

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

export interface PipelineStage {
  key: string;
  message: string;
  progress: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { key: "starting", message: "Initializing analysis...", progress: 0 },
  { key: "scraping", message: "Fetching post content...", progress: 0.1 },
  { key: "scraped", message: "Fetched content", progress: 0.3 },
  {
    key: "corroborating",
    message: "Searching for primary sources...",
    progress: 0.4,
  },
  {
    key: "auditing",
    message: "Verifying origin and temporal alignment...",
    progress: 0.7,
  },
  { key: "scoring", message: "Calculating Postcard score...", progress: 0.9 },
  { key: "complete", message: "Postcard complete", progress: 1 },
];

async function runPipelineStages(
  stages: PipelineStage[],
  updateProgress: (
    stage: string,
    message: string,
    progress: number,
  ) => Promise<void>,
  delayMs: number = 0,
  onIntermediateProgress?: () => Promise<void>,
): Promise<void> {
  for (const stage of stages) {
    await updateProgress(stage.key, stage.message, stage.progress);
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs / stages.length));
    }
  }
  if (onIntermediateProgress) {
    await onIntermediateProgress();
  }
}

export async function updateAnalysisProgress(
  analysisId: string,
  updates: {
    stage?: string;
    message?: string;
    progress?: number;
    status?: AnalysisStatus;
    error?: string;
  },
) {
  await db
    .update(analyses)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(analyses.id, analysisId));
}

export async function getExistingProcessingPostcard(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(analyses)
    .innerJoin(posts, eq(posts.id, analyses.postId))
    .where(
      and(
        eq(posts.url, normalized),
        eq(analyses.status, "processing" as AnalysisStatus),
      ),
    )
    .orderBy(sql`${analyses.createdAt} DESC`)
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPostcard(
  url: string,
  forceRefresh?: boolean,
): Promise<{ postId: string; analysisId: string }> {
  const normalized = normalizePostUrl(url);

  let pId: string;
  const aId = crypto.randomUUID();

  const existingPost = await db
    .select()
    .from(posts)
    .where(eq(posts.url, normalized))
    .limit(1);

  if (existingPost.length > 0) {
    pId = existingPost[0].id;
  } else {
    pId = crypto.randomUUID();
    await db.insert(posts).values({
      id: pId,
      url: normalized,
    });
  }

  await db.insert(analyses).values({
    id: aId,
    postId: pId,
    url: normalized,
    platform: "Other",
    postcardScore: 0,
    status: "processing",
    progress: 0,
    stage: "starting",
    message: "Initializing analysis...",
    startedAt: new Date(),
  });

  return { postId: pId, analysisId: aId };
}

export const PostcardSchema = z.object({
  username: z.string().optional().describe("User handle (e.g. '@elonmusk')"),
  timestampText: z
    .string()
    .optional()
    .describe('Relative or absolute post date (e.g. "2h ago")'),
  platform: z
    .enum(["X", "YouTube", "Reddit", "Instagram", "Other"])
    .default("Other"),
  engagement: z.record(z.string(), z.string()).optional(),
  mainText: z
    .string()
    .describe("Character-for-character extraction of the primary post content"),
});

export type Postcard = z.infer<typeof PostcardSchema>;

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
  postcard: PostcardSchema,
  markdown: z.string(), // Added to replace ocr.markdown
  triangulation: z.object({
    targetUrl: z.string().url().optional(),
    queries: z.array(z.string()),
  }),
  audit: z.object({
    originScore: z.number(),
    temporalScore: z.number(),
    totalScore: z.number(),
    auditLog: z.array(z.string()),
  }),
  corroboration: CorroborationSchema,
  timestamp: z.string().datetime(),
  analysisId: z.string().optional(),
});

export type PostcardReport = z.infer<typeof PostcardReportSchema>;

export const PostcardRequestSchema = z.object({
  url: z.string().url(),
  userApiKey: z.string().optional(),
  forceRefresh: z.boolean().optional(),
});

export type PostcardRequest = z.infer<typeof PostcardRequestSchema>;

export const PostcardResponseSchema = z.object({
  url: z.string().url(),
  markdown: z.string(),
  platform: z.string(),
  corroboration: CorroborationSchema,
  postcardScore: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  analysisId: z.string().optional(),
  forensicReport: PostcardReportSchema.optional(), // Include full report if requested
});

export type PostcardResponse = z.infer<typeof PostcardResponseSchema>;

const FAKE_POSTCARD_RESPONSE: PostcardResponse = {
  url: "https://x.com/example/status/123",
  markdown:
    "## @YeOldeTweeter\n**Breaking: local man discovers that water is, in fact, wet.**\n*14h ago · 3.2K Retweets · 21.4K Likes*",
  platform: "X",
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
  postcardScore: 0.85,
  timestamp: new Date().toISOString(),
};

export async function processPostcardFromUrl(
  url: string,
  userApiKey?: string,
  onProgress?: ProgressCallback,
  forceRefresh?: boolean,
  analysisId?: string,
): Promise<PostcardResponse & { analysisId?: string }> {
  const normalizedUrl = normalizePostUrl(url);

  const updateProgress = async (stage: string, message: string, p: number) => {
    onProgress?.(stage, message, p);
    if (analysisId) {
      await updateAnalysisProgress(analysisId, { stage, message, progress: p });
    }
  };

  if (process.env.NEXT_PUBLIC_FAKE_PIPELINE === "true") {
    const delayMs = parseInt(
      process.env.NEXT_PUBLIC_FAKE_PIPELINE_DELAY ?? "0",
      10,
    );
    const fail = process.env.NEXT_PUBLIC_FAKE_PIPELINE_FAIL === "true";
    const urlContainsFail = normalizedUrl.toLowerCase().includes("fail");

    await runPipelineStages(
      PIPELINE_STAGES,
      updateProgress,
      delayMs,
      async () => {
        await updateProgress("corroborating", "Verifying sources...", 0.5);
      },
    );

    if (fail || urlContainsFail) {
      await updateAnalysisProgress(analysisId!, {
        status: "failed",
        error: "Fake failure: External API unavailable",
      });
      throw new Error("Fake failure: External API unavailable");
    }

    return { ...FAKE_POSTCARD_RESPONSE };
  }

  try {
    if (!forceRefresh) {
      const cachedAnalysis = await db
        .select()
        .from(analyses)
        .innerJoin(posts, eq(posts.url, normalizedUrl))
        .orderBy(sql`${analyses.createdAt} DESC`)
        .limit(1);

      if (cachedAnalysis.length > 0) {
        const analysis = cachedAnalysis[0].analyses;
        if (analysis.status !== "processing") {
          await db
            .update(analyses)
            .set({ hits: sql`${analyses.hits} + 1` })
            .where(eq(analyses.id, analysis.id));
        }

        return {
          url: normalizedUrl,
          markdown: cachedAnalysis[0].posts.markdown || "",
          platform: analysis.platform || "Other",
          corroboration: {
            primarySources: JSON.parse(
              (analysis.primarySources as string) || "[]",
            ),
            queriesExecuted: JSON.parse(
              (analysis.queriesExecuted as string) || "[]",
            ),
            verdict:
              (analysis.verdict as Corroboration["verdict"]) ||
              "insufficient_data",
            summary: (analysis.summary as string) || "",
            confidenceScore: analysis.confidenceScore || 0,
            corroborationLog: JSON.parse(
              (analysis.corroborationLog as string) || "[]",
            ),
          },
          postcardScore: analysis.postcardScore,
          timestamp: analysis.createdAt.toISOString(),
          analysisId: analysis.id,
        };
      }
    }

    await updateProgress(
      "scraping",
      "Fetching content via UnifiedPostClient...",
      0.1,
    );
    const post = await unifiedPostClient.fetch(url);
    const markdown = post.markdown;

    const failureReasons: string[] = [];
    if (!markdown || markdown.length < 50) {
      failureReasons.push("Content too short or empty");
    }
    if (post.platform === "Other") {
      failureReasons.push("Platform not recognized or supported");
    }
    if (markdown?.includes("Checking if the site connection is secure")) {
      failureReasons.push("Cloudflare or security check detected");
    }
    if (markdown?.includes("login") || markdown?.includes("sign in")) {
      failureReasons.push("Login or signup wall detected");
    }

    if (failureReasons.length > 0) {
      const errorSummary = `Unable to access this content. ${failureReasons.join(". ")}. This may be due to login requirements, platform restrictions, or network issues.`;

      return {
        url,
        markdown: markdown || "",
        platform: post.platform || "Other",
        corroboration: {
          primarySources: [],
          queriesExecuted: [],
          verdict: "insufficient_data" as const,
          summary: errorSummary,
          confidenceScore: 0,
          corroborationLog: [
            `Scraping failed: ${failureReasons.join("; ")}`,
            "The platform may require authentication or block automated access.",
            `Retrieved markdown length: ${markdown?.length ?? 0} characters`,
          ],
        },
        postcardScore: 0,
        timestamp: new Date().toISOString(),
      };
    }

    await updateProgress(
      "scraped",
      `Fetched ${markdown.length} characters`,
      0.3,
    );

    const platform = post.platform;
    await updateProgress(
      "corroborating",
      "Searching for primary sources...",
      0.4,
    );

    const postcard: Postcard = {
      platform: platform as Postcard["platform"],
      username: post.author,
      timestampText: post.timestamp?.toISOString(),
      mainText: markdown.slice(0, 500),
    };

    const corroboration = await corroboratePostcard(
      postcard,
      markdown,
      async (msg: string) => {
        await updateProgress("corroborating", msg, 0.5);
      },
      userApiKey,
    );

    await updateProgress(
      "auditing",
      "Verifying origin and temporal alignment...",
      0.7,
    );
    const audit = await auditPostcard(normalizedUrl, postcard, userApiKey);

    const corroborationScore = corroboration.confidenceScore;
    const supportingSources = corroboration.primarySources.filter(
      (s: { relevance: string }) => s.relevance === "supporting",
    ).length;
    const totalSources = corroboration.primarySources.length;
    const biasScore = totalSources > 0 ? supportingSources / totalSources : 0.5;

    await updateProgress("scoring", "Calculating Postcard score...", 0.9);

    const WEIGHTS = {
      ORIGIN: 0.3,
      CORROBORATION: 0.25,
      BIAS: 0.25,
      TEMPORAL: 0.2,
    };

    const postcardScore =
      audit.originScore * WEIGHTS.ORIGIN +
      corroborationScore * WEIGHTS.CORROBORATION +
      biasScore * WEIGHTS.BIAS +
      audit.temporalScore * WEIGHTS.TEMPORAL;

    const triangulationQueries = corroboration.queriesExecuted.map(
      (q) => q.query,
    );

    try {
      const existingPost = await db
        .select()
        .from(posts)
        .where(eq(posts.url, normalizedUrl))
        .limit(1);

      let pId: string;
      let aId: string;
      if (existingPost.length > 0) {
        pId = existingPost[0].id;
        // Update the post content just in case it changed
        await db
          .update(posts)
          .set({
            markdown,
            mainText: markdown.slice(0, 500),
            updatedAt: new Date(),
          })
          .where(eq(posts.id, pId));

        // Check for existing analysis to update
        const existingAnalysis = await db
          .select()
          .from(analyses)
          .where(eq(analyses.postId, pId))
          .limit(1);

        if (existingAnalysis.length > 0) {
          aId = existingAnalysis[0].id;
          await db
            .update(analyses)
            .set({
              postcardScore,
              originScore: audit.originScore,
              corroborationScore: corroboration.confidenceScore,
              biasScore,
              temporalScore: audit.temporalScore,
              verdict: corroboration.verdict,
              summary: corroboration.summary,
              confidenceScore: corroboration.confidenceScore,
              primarySources: JSON.stringify(corroboration.primarySources),
              queriesExecuted: JSON.stringify(corroboration.queriesExecuted),
              corroborationLog: JSON.stringify(corroboration.corroborationLog),
              auditLog: JSON.stringify(audit.auditLog),
              status: "completed",
              progress: 1,
              stage: "complete",
              message: "Analysis complete",
              updatedAt: new Date(),
              createdAt: new Date(),
            })
            .where(eq(analyses.id, aId));
        } else {
          aId = crypto.randomUUID();
          await db.insert(analyses).values({
            id: aId,
            postId: pId,
            url: normalizedUrl,
            platform,
            postcardScore,
            originScore: audit.originScore,
            corroborationScore: corroboration.confidenceScore,
            biasScore,
            temporalScore: audit.temporalScore,
            verdict: corroboration.verdict,
            summary: corroboration.summary,
            confidenceScore: corroboration.confidenceScore,
            primarySources: JSON.stringify(corroboration.primarySources),
            queriesExecuted: JSON.stringify(corroboration.queriesExecuted),
            corroborationLog: JSON.stringify(corroboration.corroborationLog),
            auditLog: JSON.stringify(audit.auditLog),
            status: "completed",
            progress: 1,
            stage: "complete",
            message: "Analysis complete",
          });
        }
      } else {
        pId = crypto.randomUUID();
        await db.insert(posts).values({
          id: pId,
          url: normalizedUrl,
          platform,
          markdown,
          mainText: markdown.slice(0, 500),
        });

        aId = crypto.randomUUID();
        await db.insert(analyses).values({
          id: aId,
          postId: pId,
          url: normalizedUrl,
          platform,
          postcardScore,
          originScore: audit.originScore,
          corroborationScore: corroboration.confidenceScore,
          biasScore,
          temporalScore: audit.temporalScore,
          verdict: corroboration.verdict,
          summary: corroboration.summary,
          confidenceScore: corroboration.confidenceScore,
          primarySources: JSON.stringify(corroboration.primarySources),
          queriesExecuted: JSON.stringify(corroboration.queriesExecuted),
          corroborationLog: JSON.stringify(corroboration.corroborationLog),
          auditLog: JSON.stringify(audit.auditLog),
          status: "completed",
          progress: 1,
          stage: "complete",
          message: "Analysis complete",
        });
      }

      await updateProgress("complete", "Postcard complete", 1);

      return PostcardResponseSchema.parse({
        url: normalizedUrl,
        markdown,
        platform,
        corroboration,
        postcardScore,
        timestamp: new Date().toISOString(),
        analysisId: aId,
        forensicReport: {
          postcard: {
            platform: platform as Postcard["platform"],
            mainText: markdown.slice(0, 500),
            username: postcard.username,
            timestampText: postcard.timestampText,
          },
          markdown,
          triangulation: {
            targetUrl: normalizedUrl,
            queries: triangulationQueries,
          },
          audit: {
            originScore: audit.originScore,
            temporalScore: audit.temporalScore,
            totalScore: postcardScore,
            auditLog: audit.auditLog,
          },
          corroboration,
          timestamp: new Date().toISOString(),
          analysisId: aId,
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    return PostcardResponseSchema.parse({
      url,
      markdown,
      platform,
      corroboration,
      postcardScore,
      timestamp: new Date().toISOString(),
      forensicReport: {
        postcard: {
          platform: platform as Postcard["platform"],
          mainText: markdown.slice(0, 500),
          username: postcard.username,
          timestampText: postcard.timestampText,
        },
        markdown,
        triangulation: {
          targetUrl: url,
          queries: triangulationQueries,
        },
        audit: {
          originScore: audit.originScore,
          temporalScore: audit.temporalScore,
          totalScore: postcardScore,
          auditLog: audit.auditLog,
        },
        corroboration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Trace error:", error);
    throw error;
  }
}
