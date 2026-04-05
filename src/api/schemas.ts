import { z } from "zod";

export const AnalysisStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

// Base Post Schemas
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

// Corroboration Schemas
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

// Audit & Report Schemas
export const PostcardReportSchema = z.object({
  postcard: PostcardSchema,
  markdown: z.string(),
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
  id: z.string().optional(),
});

export type PostcardReport = z.infer<typeof PostcardReportSchema>;

// Request/Response Schemas
export const PostcardRequestSchema = z.object({
  url: z.string().url(),
  userApiKey: z.string().optional(),
  refresh: z.boolean().optional(),
  id: z.string().optional(),
});

export type PostcardRequest = z.infer<typeof PostcardRequestSchema>;

export const PostcardResponseSchema = z.object({
  url: z.string().url(),
  markdown: z.string(),
  platform: z.string(),
  corroboration: CorroborationSchema,
  postcardScore: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
  id: z.string().optional(),
  forensicReport: PostcardReportSchema.optional(),
});

export type PostcardResponse = z.infer<typeof PostcardResponseSchema>;
