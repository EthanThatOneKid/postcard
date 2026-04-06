# Postcard design spec

> **Team.** [Ethan](https://github.com/EthanThatOneKid), [Yves](https://github.com/hallowsyves), [Rohit](https://github.com/rohitj26)
> **Repository.** [postcardhq/postcard](https://github.com/postcardhq/postcard)  
> **Submission.** [Devpost](https://devpost.com/software/postcard-bpx2mz)  
> **Event.** [PantherHacks 2026](https://pantherhacks2026.devpost.com/) (April 3–5, 2026)  
> **Track.** [Cybersecurity / OSINT](https://pantherhacks2026.devpost.com/)
> **Stack.** Next.js, TypeScript, Tailwind, Google Gemini, Vercel AI SDK v6, Drizzle ORM, Turso/libSQL, Playwright, sharp

## Project vision

Postcard utilizes the **"Wisdom of the Crowd"** to trace viral social media screenshots back to their definitive source. When users upload a screenshot, Postcard locates the original post, fetches its live metadata, and calculates a **Postcard Score** to reveal how much the content has drifted from the ground truth.

### Core problem

Screenshots strip context. Cropped text, missing timestamps, and altered engagement counts make it easy to spread misinformation. Postcard restores that context by leveraging the **"Wisdom of the Crowd"** to find the primary source and audit it for forensic consistency.

### Out of scope

- Tracing multi-step attribution chains.
- Wayback Machine historical lookups (deferred for MVP).
- Mobile application (web-first for hackathon).

## Architecture

Postcard operates as a forensic pipeline designed to audit social media content. While the system supports screenshot-to-URL resolution, the primary focus is the URL-based entrypoint, where users submit a direct post URL for deep forensic verification.

### Pipeline flow

```
Post URL
    │
    ▼
┌───────────────────┐
│ 1. Ingest         │  Multimodal (Scanning Source)
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Audit          │  Playwright — live site verification
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 3. Corroboration  │  Gemini-powered deep search
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 4. Verification   │  Terminal-inspired platform
└─────────┬─────────┘
          ▼
PostcardReport
```

### Forensic pipeline components

- **Multimodal ingest.** Postcard utilizes Jina Reader to ingest live content and metadata, establishing the "ground truth" for the forensic audit.
- **Forensic audit.** Postcard uses Playwright to perform direct site checks, verifying origin and ensuring temporal alignment with the reported narrative.
- **Corroboration engine.** Postcard performs deep search across trusted domains to verify claims and find mentions of the content elsewhere to determine its "drift."
- **Verification platform.** Built with Next.js and Tailwind CSS, providing a clean, terminal-inspired interface for quick, simple forensic verification.

### Stages

> **Note:** The pipeline supports both URL-based and screenshot-based entrypoints. The screenshot workflow (Preprocessor → Inference → Navigator) is part of the original vision and is currently disabled in production.

#### Preprocessor

> _Applies to screenshot-based workflow only (currently disabled)_

The preprocessor uses sharp to normalize contrast, adjust brightness, and sharpen the image. This optimization ensures high-quality OCR results during resolution.

#### Inference

> _Applies to screenshot-based workflow only (currently disabled)_

Gemini 2.5/3+ analyzes the processed image to extract structured metadata and infer the social media platform (X, YouTube, Reddit, Instagram, or 'Other'). This inference is critical for direct search dorking.

#### Navigator

> _Applies to screenshot-based workflow only (currently disabled)_

The navigator agent triangulates the source URL using OCR metadata and platform clues. It generates targeted search queries and prioritizes primary sources over aggregators.

**Content ingestion (UnifiedPost strategy).** To ensure maximum reliability and bypass common "login required" blocks, Postcard uses a Strategy Pattern for data ingestion. The system inspects the URL and delegates to the most robust UnifiedPostClient:

- **Reddit strategy.** Uses the native `.json` endpoint for character-perfect markdown.
- **YouTube strategy.** Uses oEmbed for video metadata and shadow scrapers for community posts.
- **Social oEmbed (X, TikTok, Instagram).** Leverages official oEmbed APIs to capture high-fidelity metadata (author names, absolute timestamps) even when direct scraping is blocked.
- **Jina fallback.** Acts as a high-fidelity markdown scraper for general websites.

This stage produces a UnifiedPost object, standardizing the "ground truth" for the forensic audit. When ingestion is blocked by a platform, the UI provides transparency by displaying the raw markdown retrieved during the attempt.

#### Verifier

The verifier agent computes origin reachability and temporal alignment scores using Gemini. It performs Google Dorking to identify primary sources (news articles, official statements, repository logs) that verify or refute the post's content.

## Database and caching

Postcard uses Drizzle ORM with Turso/libSQL for type-safe server-side caching and forensic log storage.

### Cache forensic results

Postcard caches forensic results at the **resolved post URL** level.

- **Cache check.** Postcard queries the `posts` table for the resolved URL.
- **Cache hit.** Postcard increments the `hits` count on the associated `analysis`, then serves cached forensic data and the postcard score.
- **Cache miss.** Postcard scrapes via Jina Reader, performs full corroboration, and persists a new forensic record.

## Score logic

The system combines subscores into a weighted percentage (0–100%) to provide a high-fidelity forensic verdict—where a lower score denotes greater unreliability and a higher score signifies a verified origin.

### Weighted formula

```javascript
// Weights are calibrated to prioritize origin reachability and corroboration.
const WEIGHTS = {
  ORIGIN: 0.3, // URL reachability
  CORROBORATION: 0.25, // Independent source count
  BIAS: 0.25, // Editorial divergence
  TEMPORAL: 0.2, // Timestamp alignment
};

const TotalScore =
  O * WEIGHTS.ORIGIN +
  C * WEIGHTS.CORROBORATION +
  B * WEIGHTS.BIAS +
  T * WEIGHTS.TEMPORAL;
```

## API spec

Postcard follows **Google AIP-121** (Resource-Oriented Design) and **AIP-122** (Standard Methods).

For the complete API reference with examples, see **[API.md](API.md)**.

### Endpoints

| Method   | Path                     | Description                                                                                     |
| :------- | :----------------------- | :---------------------------------------------------------------------------------------------- |
| **GET**  | `/postcards?url=`        | SSR page - core entrypoint. Displays report or initiates new analysis if API key cookie is set. |
| **GET**  | `/api/postcards?url=`    | API read-only - returns current DB state (200 OK, 202 Processing, or 404 Not Found).            |
| **POST** | `/api/postcards`         | Submit post URL and start forensic analysis (accepts JSON body with `userApiKey`).              |
| **GET**  | `/api/postcards/[id]/og` | Generates a dynamic High-Fidelity Open Graph PNG image for social media embeds                  |

### API design decisions

- **Server-side rendering (SSR) entrypoint.** The `/postcards?url=` page provides the primary way users interact with the system. It automatically starts an analysis if the URL is not cached and the `postcard_api_key` cookie contains a valid Gemini API key.
- **Cookie-based transport.** To support SSR auto-start, the Gemini API key is stored in a browser cookie. This allows the server to read the key during the initial document request without requiring a client-side POST.
- **Read-only GET API.** The `GET /api/postcards?url=` endpoint is strictly read-only. It does not trigger new analyses or refreshes, ensuring predictable behavior for external callers and polling.
- **Cached results.** Postcard makes completed forensic reports public; they require no API key to view. A user's key is only used to initiate a fresh analysis or a forced refresh.
- **Polling progress.** Clients should poll `GET /api/postcards?url=...` for updates while an analysis is in the `processing` state.

## Known constraints and performance

The Postcard pipeline relies on the **Google Gemini API Free Tier**, which imposes strict rate limits (e.g., `GenerateRequestsPerMinutePerProjectPerModel`).

- **Rate limits.** During heavy analysis, the system may return a `429 Too Many Requests` error. The UI gracefully handles these by transitioning to a failed state.
- **Demo stable.** For production demonstrations, it is recommended to use **Fake Mode** (`NEXT_PUBLIC_FAKE_PIPELINE=true`) to ensure 100% responsiveness without hitting AI quota.
