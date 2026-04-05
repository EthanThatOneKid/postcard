/**
 * Postcard Configuration & Defaults
 * Centralized for easier maintenance and service-owner tuning.
 */

// Model ID for AI Agents
export const DEFAULT_MODEL =
  process.env.GOOGLE_GENERATIVE_AI_MODEL_ID || "gemini-2.0-flash";

// Grounding Limits
export const MAX_TOOL_CALLS = parseInt(
  process.env.POSTCARD_MAX_TOOL_CALLS || "5",
  10,
);
export const MAX_SOURCES = parseInt(
  process.env.POSTCARD_MAX_SOURCES || "10",
  10,
);

// Scoring Logic Weights (Should sum to 1.0)
export const SCORING_WEIGHTS = {
  ORIGIN: parseFloat(process.env.POSTCARD_WEIGHT_ORIGIN || "0.3"),
  CORROBORATION: parseFloat(
    process.env.POSTCARD_WEIGHT_CORROBORATION || "0.25",
  ),
  BIAS: parseFloat(process.env.POSTCARD_WEIGHT_BIAS || "0.25"),
  TEMPORAL: parseFloat(process.env.POSTCARD_WEIGHT_TEMPORAL || "0.2"),
};

// Trusted Domains for search grounding
export const TRUSTED_DOMAINS = [
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

// Forensic Pipeline Stages
export interface PipelineStage {
  key: string;
  message: string;
  progress: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  { key: "starting", message: "Initializing postcard...", progress: 0 },
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
