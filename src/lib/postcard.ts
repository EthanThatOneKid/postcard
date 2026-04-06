import { db } from "@/src/db";
import { postcards, posts } from "@/src/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { corroboratePostcard } from "./agents/corroborator";
import { auditPostcard } from "./agents/verifier";
import { unifiedPostClient } from "./ingest";
import { normalizePostUrl } from "./url";
import crypto from "crypto";
import {
  PostcardResponseSchema,
  type Postcard,
  type PostcardResponse,
  type AnalysisStatus,
  type PostcardReport,
  type Corroboration,
} from "@/src/api/schemas";

export {
  PostcardResponseSchema,
  type Postcard,
  type PostcardResponse,
  type AnalysisStatus,
  type PostcardReport,
  type Corroboration,
};
import { fromPostcardRow } from "@/src/api/conversions";

export type ProgressCallback = (
  stage: string,
  message: string,
  progress: number,
) => void;

import { type PipelineStage, PIPELINE_STAGES, SCORING_WEIGHTS } from "./config";

/**
 * Creates a heartbeat "pulse" that periodically updates the progress message
 * if a stage takes too long. This reassures the user that the system is active.
 */
function createPulse(
  currentStage: string,
  baseMessage: string,
  currentProgress: number,
  updateFn: (stage: string, message: string, progress: number) => Promise<void>,
  intervalMs: number = 3000,
) {
  let count = 0;
  const indicators = ["", ".", "..", "..."];
  const pulseMessages = [
    "Searching deep...",
    "Analyzing metadata...",
    "Confirming platform response...",
    "Still working...",
    "Verifying source integrity...",
  ];

  const interval = setInterval(() => {
    count++;
    const indicator = indicators[count % indicators.length];
    const subMessage =
      pulseMessages[
        Math.floor(count / indicators.length) % pulseMessages.length
      ];
    const heartbeatMessage = `${baseMessage}${indicator} (${subMessage})`;
    updateFn(currentStage, heartbeatMessage, currentProgress).catch(
      console.error,
    );
  }, intervalMs);

  return () => clearInterval(interval);
}

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

export async function updatePostcardRow(
  id: string,
  updates: {
    stage?: string;
    message?: string;
    progress?: number;
    status?: AnalysisStatus;
    error?: string;
  },
) {
  await db
    .update(postcards)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(postcards.id, id));
}

export async function incrementPostcardHits(id: string) {
  await db
    .update(postcards)
    .set({ hits: sql`${postcards.hits} + 1` })
    .where(eq(postcards.id, id));
}

export async function getOrCreatePostByUrl(
  url: string,
): Promise<{ id: string; url: string }> {
  const normalized = normalizePostUrl(url);

  const existing = await db
    .select()
    .from(posts)
    .where(eq(posts.url, normalized))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const id = crypto.randomUUID();
  await db.insert(posts).values({
    id,
    url: normalized,
  });

  return { id, url: normalized };
}

export async function getExistingProcessingPostcard(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(and(eq(posts.url, normalized), eq(postcards.status, "processing")))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createPostcard(
  url: string,
): Promise<{ postId: string; id: string }> {
  const normalized = normalizePostUrl(url);
  const { id: pId } = await getOrCreatePostByUrl(normalized);
  const id = crypto.randomUUID();

  await db.insert(postcards).values({
    id,
    postId: pId,
    url: normalized,
    platform: "Other",
    postcardScore: 0,
    status: "processing",
    progress: 0,
    stage: "starting",
    message: "Initializing postcard...",
    startedAt: new Date(),
  });

  return { postId: pId, id };
}

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
  refresh?: boolean,
  id?: string,
): Promise<PostcardResponse & { id?: string }> {
  const normalizedUrl = normalizePostUrl(url);

  const updateProgress = async (stage: string, message: string, p: number) => {
    onProgress?.(stage, message, p);
    if (id) {
      await updatePostcardRow(id, {
        stage,
        message,
        progress: p,
      });
    }
  };

  try {
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
        if (id) {
          await updatePostcardRow(id, {
            status: "failed",
            error: "Fake failure: External API unavailable",
          });
        }
        throw new Error("Fake failure: External API unavailable");
      }

      if (id) {
        const pIdRow = await db
          .select({ postId: postcards.postId })
          .from(postcards)
          .where(eq(postcards.id, id))
          .limit(1);
        if (pIdRow.length > 0) {
          await db
            .update(posts)
            .set({
              platform: FAKE_POSTCARD_RESPONSE.platform,
              markdown: FAKE_POSTCARD_RESPONSE.markdown,
              mainText: FAKE_POSTCARD_RESPONSE.markdown.slice(0, 500),
              updatedAt: new Date(),
            })
            .where(eq(posts.id, pIdRow[0].postId));
        }

        await db
          .update(postcards)
          .set({
            platform: FAKE_POSTCARD_RESPONSE.platform,
            postcardScore: Math.floor(
              FAKE_POSTCARD_RESPONSE.postcardScore * 100,
            ),
            verdict: FAKE_POSTCARD_RESPONSE.corroboration.verdict,
            summary: FAKE_POSTCARD_RESPONSE.corroboration.summary,
            confidenceScore:
              FAKE_POSTCARD_RESPONSE.corroboration.confidenceScore,
            primarySources: JSON.stringify(
              FAKE_POSTCARD_RESPONSE.corroboration.primarySources,
            ),
            queriesExecuted: JSON.stringify(
              FAKE_POSTCARD_RESPONSE.corroboration.queriesExecuted,
            ),
            corroborationLog: JSON.stringify(
              FAKE_POSTCARD_RESPONSE.corroboration.corroborationLog,
            ),
            status: "completed",
            progress: 1,
            stage: "complete",
            message: "Analysis complete",
            updatedAt: new Date(),
          })
          .where(eq(postcards.id, id));
      }

      return { ...FAKE_POSTCARD_RESPONSE, id };
    }

    try {
      if (!refresh) {
        const cachedResult = await db
          .select()
          .from(postcards)
          .innerJoin(posts, eq(posts.url, normalizedUrl))
          .orderBy(sql`${postcards.createdAt} DESC`)
          .limit(1);

        if (cachedResult.length > 0) {
          const { postcards: row, posts: post } = cachedResult[0];

          const report = fromPostcardRow(row, post);
          return PostcardResponseSchema.parse({
            url: normalizedUrl,
            markdown: post.markdown || "",
            platform: row.platform || "Other",
            corroboration: report.corroboration,
            postcardScore: row.postcardScore / 100,
            timestamp: row.createdAt.toISOString(),
            id: row.id,
            forensicReport: report,
          });
        }
      }

      // 1. Scraping Layer
      const baseScrapingMsg = "Fetching content from platform";
      await updateProgress("scraping", baseScrapingMsg, 0.1);
      const stopScrapingPulse = createPulse(
        "scraping",
        baseScrapingMsg,
        0.1,
        updateProgress,
      );

      let postData;
      try {
        postData = await unifiedPostClient.fetch(url, (msg) => {
          updateProgress("scraping", msg, 0.15).catch(console.error);
        });
      } finally {
        stopScrapingPulse();
      }

      const markdown = postData.markdown;

      const failureReasons: string[] = [];
      if (!markdown || markdown.length < 50) {
        failureReasons.push("Content too short or empty");
      }
      if (postData.platform === "Other") {
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
          platform: postData.platform || "Other",
          corroboration: {
            primarySources: [],
            queriesExecuted: [],
            verdict: "insufficient_data",
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

      const platform = postData.platform;

      // 2. Corroboration Layer
      const baseCorroborationMsg = "Searching for primary sources";
      await updateProgress("corroborating", baseCorroborationMsg, 0.4);
      const stopCorroborationPulse = createPulse(
        "corroborating",
        baseCorroborationMsg,
        0.4,
        updateProgress,
      );

      const postcard: Postcard = {
        platform: platform as Postcard["platform"],
        username: postData.author,
        timestampText: postData.timestamp?.toISOString(),
        mainText: markdown.slice(0, 500),
      };

      let corroboration;
      try {
        corroboration = await corroboratePostcard(
          postcard,
          markdown,
          async (msg: string) => {
            await updateProgress("corroborating", msg, 0.5);
          },
          userApiKey,
        );
      } finally {
        stopCorroborationPulse();
      }

      // 3. Auditing Layer
      const baseAuditingMsg = "Verifying origin and temporal alignment";
      await updateProgress("auditing", baseAuditingMsg, 0.7);
      const stopAuditingPulse = createPulse(
        "auditing",
        baseAuditingMsg,
        0.7,
        updateProgress,
      );

      let audit;
      try {
        audit = await auditPostcard(normalizedUrl, postcard, userApiKey);
      } finally {
        stopAuditingPulse();
      }

      const corroborationScore = corroboration.confidenceScore;
      const supportingSources = corroboration.primarySources.filter(
        (s) => s.relevance === "supporting",
      ).length;
      const totalSources = corroboration.primarySources.length;
      const biasScore =
        totalSources > 0 ? supportingSources / totalSources : 0.5;

      await updateProgress("scoring", "Calculating Postcard score...", 0.9);

      const rawScore =
        audit.originScore * SCORING_WEIGHTS.ORIGIN +
        corroborationScore * SCORING_WEIGHTS.CORROBORATION +
        biasScore * SCORING_WEIGHTS.BIAS +
        audit.temporalScore * SCORING_WEIGHTS.TEMPORAL;

      const postcardScore = Math.floor(rawScore * 100);

      const { id: pId } = await getOrCreatePostByUrl(normalizedUrl);

      await db
        .update(posts)
        .set({
          platform: postcard.platform,
          markdown,
          mainText: markdown.slice(0, 500),
          username: postcard.username,
          timestampText: postcard.timestampText,
          updatedAt: new Date(),
        })
        .where(eq(posts.id, pId));

      const aId = id || crypto.randomUUID();
      // Ensure we have a row if it's untracked
      const existingRow = id
        ? null
        : await db
            .select()
            .from(postcards)
            .where(eq(postcards.id, aId))
            .limit(1);

      if (id || existingRow?.length) {
        await db
          .update(postcards)
          .set({
            postId: pId,
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
          })
          .where(eq(postcards.id, aId));
      } else {
        await db.insert(postcards).values({
          id: aId,
          postId: pId,
          url: normalizedUrl,
          platform: postcard.platform,
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

      // Re-fetch to get the final state cleanly
      const finalResult = await db
        .select()
        .from(postcards)
        .innerJoin(posts, eq(posts.id, postcards.postId))
        .where(eq(postcards.id, aId))
        .limit(1);

      const finalRow = finalResult[0].postcards;
      const finalPost = finalResult[0].posts;
      const report = fromPostcardRow(finalRow, finalPost);

      return PostcardResponseSchema.parse({
        url: normalizedUrl,
        markdown: finalPost.markdown || "",
        platform: finalRow.platform || "Other",
        corroboration: report.corroboration,
        postcardScore: finalRow.postcardScore / 100,
        timestamp: finalRow.createdAt.toISOString(),
        id: finalRow.id,
        forensicReport: report,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }
  } catch (error: unknown) {
    console.error("Trace error:", error);
    if (id) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await updatePostcardRow(id, {
        status: "failed",
        error: errorMessage,
      }).catch(console.error);
    }
    throw error;
  }
}
