import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import { z } from "zod";
import type { Postmark } from "../vision/ocr";

const TRUSTED_DOMAINS = [
  "nytimes.com",
  "washingtonpost.com",
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "theguardian.com",
  "cnn.com",
  "msnbc.com",
  "foxnews.com",
  "npr.org",
  "wsj.com",
  "bloomberg.com",
  "politico.com",
  "thehill.com",
  "usatoday.com",
  "latimes.com",
  "axios.com",
  "nbcnews.com",
  "abcnews.com",
  "cbsnews.com",
] as const;

const PlatformDorkPatterns: Record<string, string> = {
  X: (query: string) =>
    `site:x.com OR site:twitter.com "${query.slice(0, 100)}"`,
  YouTube: (query: string) => `site:youtube.com "${query.slice(0, 80)}"`,
  Reddit: (query: string) => `site:reddit.com "${query.slice(0, 80)}"`,
  Instagram: (query: string) => `site:instagram.com "${query.slice(0, 80)}"`,
  Other: (query: string) => `"${query.slice(0, 100)}"`,
};

export const CorroborationSourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  source: z.string(),
  snippet: z.string(),
  relevance: z.enum(["supporting", "refuting", "neutral"]),
  publishedDate: z.string().optional(),
});

export const CorroborationResultSchema = z.object({
  primarySources: z.array(CorroborationSourceSchema),
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

export type CorroborationSource = z.infer<typeof CorroborationSourceSchema>;
export type CorroborationResult = z.infer<typeof CorroborationResultSchema>;

const MAX_TOOL_CALLS = 5;
const MAX_SOURCES = 10;

export async function corroboratePostmark(
  postmark: Postmark,
  mainText: string,
  onProgress?: (log: string) => void,
): Promise<CorroborationResult> {
  const corroborationLog: string[] = [];
  const primarySources: CorroborationSource[] = [];
  const queriesExecuted: { query: string; sourcesFound: number }[] = [];

  const log = (message: string) => {
    corroborationLog.push(message);
    onProgress?.(message);
  };

  log(
    `Starting corroboration for ${postmark.platform} post by ${postmark.username ?? "unknown"}`,
  );

  const dorkFn =
    PlatformDorkPatterns[postmark.platform] ?? PlatformDorkPatterns.Other;

  const searchQueries = [
    dorkFn(mainText),
    ...(postmark.username
      ? [`site:${postmark.platform.toLowerCase()}.com "${postmark.username}"`]
      : []),
    ...(postmark.timestampText
      ? [`"${postmark.timestampText}" ${mainText.slice(0, 50)}`]
      : []),
  ].slice(0, 3);

  const { fullStream } = await generateText({
    model: google("gemini-2.0-flash"),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    maxToolCalls: MAX_TOOL_CALLS,
    system: `You are the "Corroboration Auditor" for Postcard, a digital forensics system.
Your goal is to find primary sources that verify or refute the claims in a social media post.

TRUSTED DOMAINS (use site: operator):
${TRUSTED_DOMAINS.map((d) => `  - ${d}`).join("\n")}

PLATFORM DORKING PATTERNS:
- X/Twitter: site:x.com OR site:twitter.com "exact phrase"
- YouTube: site:youtube.com "video title or description"
- Reddit: site:reddit.com "thread or comment text"
- News: site:nytimes.com "specific statement"

For each search, examine results from trusted domains first, then note other relevant sources.
Return findings in the structured format with relevance classification.`,
    messages: [
      {
        role: "user",
        content: `Corroborate this post:

Platform: ${postmark.platform}
Username: ${postmark.username ?? "unknown"}
Timestamp: ${postmark.timestampText ?? "unknown"}
Engagement: ${JSON.stringify(postmark.engagement ?? {})}

Post Content:
${mainText}

Search for corroborating or refuting sources. Focus on:
1. News articles from trusted domains
2. Official statements or press releases
3. Public records or repository logs
4. Other social media posts from the same source

Use the google_search tool to execute your searches.`,
      },
    ],
  });

  let toolCallCount = 0;

  for await (const { type, toolCall, toolResult } of fullStream) {
    if (type === "tool-call" && toolCall.functionName === "google_search") {
      toolCallCount++;
      const query = toolCall.args.query as string;
      log(
        `Executing search query ${toolCallCount}/${MAX_TOOL_CALLS}: ${query.slice(0, 80)}...`,
      );

      queriesExecuted.push({ query, sourcesFound: 0 });
    }

    if (type === "tool-result" && toolResult.functionName === "google_search") {
      const result = toolResult.result as {
        results?: Array<{ title?: string; url?: string; snippet?: string }>;
      };
      const sources = result?.results ?? [];
      log(`Found ${sources.length} results`);

      for (const source of sources.slice(0, 3)) {
        if (primarySources.length >= MAX_SOURCES) break;

        const domain = new URL(
          source.url ?? "https://example.com",
        ).hostname.replace("www.", "");
        const isTrusted = TRUSTED_DOMAINS.some((d) => domain.includes(d));

        primarySources.push({
          url: source.url ?? "https://example.com",
          title: source.title ?? "Untitled",
          source: domain,
          snippet: source.snippet ?? "",
          relevance: isTrusted ? "supporting" : "neutral",
        });
      }

      queriesExecuted[queriesExecuted.length - 1].sourcesFound = sources.length;
    }
  }

  const trustedCount = primarySources.filter((s) =>
    TRUSTED_DOMAINS.some((d) => s.source.includes(d)),
  ).length;

  let verdict: CorroborationResult["verdict"];
  let confidenceScore: number;

  if (trustedCount >= 3) {
    verdict = "verified";
    confidenceScore = 0.9;
  } else if (trustedCount >= 1) {
    verdict = "verified";
    confidenceScore = 0.7;
  } else if (primarySources.length > 0) {
    verdict = "inconclusive";
    confidenceScore = 0.5;
  } else {
    verdict = "insufficient_data";
    confidenceScore = 0.2;
  }

  log(
    `Corroboration complete: ${primarySources.length} sources found, ${trustedCount} from trusted domains`,
  );

  const summary =
    trustedCount >= 3
      ? `Found ${trustedCount} corroborating sources from trusted domains. Content appears verified.`
      : trustedCount >= 1
        ? `Found ${trustedCount} corroborating source(s) from trusted domains. Additional verification recommended.`
        : primarySources.length > 0
          ? `Found ${primarySources.length} related sources but none from trusted domains.`
          : `No corroborating sources found. Unable to verify content claims.`;

  return CorroborationResultSchema.parse({
    primarySources: primarySources.slice(0, MAX_SOURCES),
    queriesExecuted,
    verdict,
    summary,
    confidenceScore,
    corroborationLog,
  });
}
