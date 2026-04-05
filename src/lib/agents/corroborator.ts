import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText, stepCountIs } from "ai";
import { z } from "zod";
import type { Postcard } from "@/src/lib/postcard";

function getGoogleProvider(apiKey?: string) {
  if (apiKey) {
    return createGoogleGenerativeAI({ apiKey });
  }
  return google;
}

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
  "snopes.com",
  "factcheck.org",
  "politifact.com",
  "fullfact.org",
  "polymarket.com",
  "wikipedia.org",
] as const;

export const CorroborationSourceSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  source: z.string(),
  snippet: z.string(),
  relevance: z.enum(["supporting", "refuting", "neutral"]),
  publishedDate: z.string().optional(),
});

const VerdictSchema = z.object({
  verdict: z.enum([
    "verified",
    "disputed",
    "inconclusive",
    "insufficient_data",
  ]),
  confidenceScore: z.number().min(0).max(1),
  summary: z.string(),
  sourceRelevance: z.record(
    z.string(),
    z.enum(["supporting", "refuting", "neutral"]),
  ),
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

export async function corroboratePostcard(
  postcard: Postcard,
  originalMarkdown: string,
  onProgress?: (message: string) => void,
  apiKey?: string,
): Promise<CorroborationResult> {
  const googleProvider = getGoogleProvider(apiKey);
  const corroborationLog: string[] = [];
  const primarySources: CorroborationSource[] = [];
  const queriesExecuted: { query: string; sourcesFound: number }[] = [];

  const log = (message: string) => {
    corroborationLog.push(message);
    onProgress?.(message);
  };

  log(
    `Starting corroboration for ${postcard.platform} post by ${postcard.username ?? "unknown"}`,
  );

  log(`Starting search grounding for ${postcard.platform} post...`);

  const { fullStream } = await streamText({
    model: googleProvider("gemini-2.0-flash"),
    tools: {
      google_search: googleProvider.tools.googleSearch({}),
    },
    stopWhen: stepCountIs(MAX_TOOL_CALLS),
    system: `You are a forensic media analyst. Your mission is to find primary sources that verify or refute the claims in a social media post using Google Search.

TRUSTED DOMAINS (use site: operator for higher relevance):
${TRUSTED_DOMAINS.map((d) => `  - ${d}`).join("\n")}

CRITICAL: You must classify EACH source as one of:
- "supporting" - Source confirms or aligns with the claim
- "refuting" - Source directly contradicts or debunks the claim
- "neutral" - Source is tangentially related but neither confirms nor denies

For each source found, consider:
1. Does it confirm the specific claims made?
2. Does it contradict or debunk misinformation?
3. Is it from a fact-checking organization debunking this?

PLATFORM DORKING PATTERNS:
- X/Twitter: site:x.com OR site:twitter.com "exact phrase"
- YouTube: site:youtube.com "video title or description"
- Reddit: site:reddit.com "thread or comment text"
- News: site:nytimes.com "specific statement"

If you can't find direct news confirmation, SEARCH for 'hoax', 'debunked', or 'fact-check' along with the core claims.
For each search, examine results from trusted domains first, then note other relevant sources.`,
    messages: [
      {
        role: "user",
        content: `Analyze this post for truthfulness:

Platform: ${postcard.platform}
Username: ${postcard.username ?? "unknown"}
Content: ${originalMarkdown}

Search for corroborating OR REFUTING sources. Important: Look for both:
1. Sources that SUPPORT the claim (confirming it)
2. Sources that REFUTE the claim (debunking it, fact-checks, hoaxes)

Use the google_search tool to execute your searches.`,
      },
    ],
  });

  let toolCallCount = 0;

  for await (const part of fullStream) {
    if (part.type === "tool-call") {
      if (part.toolName === "google_search") {
        toolCallCount++;
        const input = part.input as { query: string };
        const query = input.query;
        log(
          `Executing search query ${toolCallCount}/${MAX_TOOL_CALLS}: ${query.slice(0, 80)}...`,
        );
        queriesExecuted.push({ query, sourcesFound: 0 });
      }
    }

    if (part.type === "tool-result") {
      if (part.toolName === "google_search") {
        const output = part.output as {
          results?: Array<{ title?: string; url?: string; snippet?: string }>;
        };
        const sources = output?.results ?? [];
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

        if (queriesExecuted.length > 0) {
          queriesExecuted[queriesExecuted.length - 1].sourcesFound =
            sources.length;
        }
      }
    }
  }

  log(`Analyzing ${primarySources.length} sources for verdict...`);

  const sourceContext = primarySources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title} (${s.source}): ${s.snippet.slice(0, 200)}`,
    )
    .join("\n");

  const { text: verdictText } = await generateText({
    model: googleProvider("gemini-2.0-flash"),
    system: `You are a forensic media analyst. Based on the search results, provide a structured verdict about whether the social media post is TRUE, FALSE, or UNCERTAIN.

IMPORTANT: Your job is to be CRITICAL and SKEPTICAL. Social media is full of misinformation. Consider:
- Fact-checking sites (Snopes, PolitiFact, FactCheck.org) are highly authoritative
- If a claim seems sensational, it often is
- Multiple refuting sources = likely false
- Only trusted news sources count as strong corroboration

Return a JSON object with:
{
  "verdict": "verified" | "disputed" | "inconclusive" | "insufficient_data",
  "confidenceScore": 0.0 to 1.0,
  "summary": "A detailed explanation of WHY this content is flagged as it is. Explain the specific evidence found.",
  "sourceRelevance": { "url1": "supporting|refuting|neutral", ... }
}

Verdict guidelines:
- "verified": Multiple trusted sources confirm the core claims
- "disputed": Evidence is mixed OR trusted sources contradict the claims
- "inconclusive": Insufficient evidence to determine, but some related sources found
- "insufficient_data": No meaningful sources found to evaluate`,
    prompt: `Social media post to analyze:
Platform: ${postcard.platform}
Username: ${postcard.username ?? "unknown"}
Content: ${originalMarkdown}

Search results found:
${sourceContext || "No sources found."}

Determine the verdict and explain WHY in detail.`,
  });

  let verdict: CorroborationResult["verdict"] = "inconclusive";
  let confidenceScore = 0.5;
  let summary = "";
  const sourceRelevance: Record<string, string> = {};

  try {
    const jsonMatch = verdictText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = VerdictSchema.parse(JSON.parse(jsonMatch[0]));
      verdict = parsed.verdict;
      confidenceScore = parsed.confidenceScore;
      summary = parsed.summary;

      for (const [url, relevance] of Object.entries(parsed.sourceRelevance)) {
        sourceRelevance[url] = relevance;
      }
    }
  } catch {
    log("Could not parse AI verdict, using fallback logic");
  }

  if (!summary) {
    const supportingCount = primarySources.filter(
      (s) => s.relevance === "supporting",
    ).length;
    const refutingCount = primarySources.filter(
      (s) => s.relevance === "refuting",
    ).length;
    const trustedCount = primarySources.filter((s) =>
      TRUSTED_DOMAINS.some((d) => s.source.includes(d)),
    ).length;

    if (refutingCount > 0 && refutingCount >= supportingCount) {
      verdict = "disputed";
      confidenceScore = 0.3;
      summary = `Found ${refutingCount} source(s) that refute or debunk this claim. Content appears to be misinformation.`;
    } else if (trustedCount >= 3) {
      verdict = "verified";
      confidenceScore = 0.9;
      summary = `Found ${trustedCount} corroborating sources from trusted domains. Content appears verified.`;
    } else if (trustedCount >= 1) {
      verdict = "verified";
      confidenceScore = 0.7;
      summary = `Found ${trustedCount} corroborating source(s) from trusted domains. Additional verification recommended.`;
    } else if (primarySources.length > 0) {
      verdict = "inconclusive";
      confidenceScore = 0.5;
      summary = `Found ${primarySources.length} related sources but none from trusted domains. Unable to definitively verify.`;
    } else {
      verdict = "insufficient_data";
      confidenceScore = 0.2;
      summary =
        "No corroborating sources found. Unable to verify content claims.";
    }
  }

  for (const source of primarySources) {
    if (sourceRelevance[source.url]) {
      source.relevance = sourceRelevance[source.url] as
        | "supporting"
        | "refuting"
        | "neutral";
    }
  }

  log(
    `Corroboration complete: ${primarySources.length} sources, verdict: ${verdict}`,
  );

  return CorroborationResultSchema.parse({
    primarySources: primarySources.slice(0, MAX_SOURCES),
    queriesExecuted,
    verdict,
    summary,
    confidenceScore,
    corroborationLog,
  });
}
