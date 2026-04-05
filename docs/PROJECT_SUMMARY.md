# Postcard project summary

> **Submission:** [Devpost](https://devpost.com/software/postcard-bpx2mz)
> **Team:** Ethan + Yves + Rohit  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Repository:** `postcard`

## What it does

**Postcard** is a digital forensics tool that takes a social media post URL, traces it back to its original source, and produces a **postcard score (0–100%)** measuring how much the content has drifted from the primary truth.

Tagline: _Trace every post back to its source._

## The problem

Screenshots strip all context. By the time something goes viral it's been cropped, captioned, and misattributed. A screenshot of a tweet looks nothing like the original tweet. A screenshot of a news article removes the byline, date, and corrections footer. Postcard reverses that entropy by performing a multi-stage forensic audit of the primary source.

## How it works

**User flow:** Enter Post URL → Forensic Pipeline Runs → Postcard Score + Subscore Breakdown appears.

### Entrypoint

Users submit the direct source URL for forensic verification. While the system supports screenshot-to-URL resolution, the primary focus is the direct URL entrypoint to ensure 100% forensic precision.

### Ingestion

Postcard uses the **Jina Reader API** to ingest live content and metadata (like counts, absolute timestamps, text) from the provided URL. This establishes the "ground truth" for the forensic audit.

### Audit

The system uses **Playwright** to scrape the live site and compute forensic subscores (Origin, Temporal, Visual).

### Corroboration

An AI SDK agent loop with **Google Search grounding** performs deep dorking across trusted domains (X, Reddit, and News archives) to verify or refute the claim.

## Architecture

```
Post URL
    │
    ▼
┌───────────────────┐
│ 1. URL Entrypoint │  Direct input (SSE Stream)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Content Ingest │  Jina Reader — fetches ground truth
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 3. Forensic Audit │  Playwright — live sit verification
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 4. Corroboration  │  Gemini 2.5 Flash — deep search dorking
└─────────┬─────────┘
          ▼
PostcardReport
```

## Tech stack

| Layer      | Choice                                               |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 16 (TypeScript)                              |
| Styling    | Vanilla CSS (Premium Aesthetics)                     |
| Hosting    | Vercel                                               |
| AI SDK     | Vercel AI SDK v6 (`@ai-sdk/google`)                  |
| Model      | Gemini 2.0 Flash (OCR), Gemini 2.5 Flash (Navigator) |
| Database   | SQLite (libSQL for Turso)                            |
| Automation | Playwright + sharp                                   |

## Key decisions

- **Postcard Noun:** Unified all terminology to "Postcard" (the tool) and "Postcard Score" (the result).
- **JSON SSE:** Used JSON body for `POST /api/postcards` to simplify the OpenAPI spec.
- **Forensic Weights:** Implemented a refined 4-part forensic model (Origin 30%, Corroboration 25%, Bias 25%, Temporal 20%).
- **Vetted Sources:** Implemented TLD-permissive logic (`.gov`, `.edu`, `.org`).
