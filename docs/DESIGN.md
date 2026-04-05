# Postcard design spec

> **Team:** [Ethan](https://github.com/EthanThatOneKid), [Yves](https://github.com/hallowsyves), [Rohit](https://github.com/rohitj26)
> **Repository:** [postcardhq/postcard](https://github.com/postcardhq/postcard)  
> **Submission:** [Devpost](https://devpost.com/software/postcard-bpx2mz)  
> **Event:** [PantherHacks 2026](https://pantherhacks2026.devpost.com/) (April 3–5, 2026)  
> **Track:** [Cybersecurity / OSINT](https://pantherhacks2026.devpost.com/)
> **Stack:** Next.js, TypeScript, Tailwind, Google Gemini, Vercel AI SDK v6, Drizzle ORM, Turso/libSQL, Playwright, sharp

## Project vision

Postcard reverses the entropy of social media screenshots by tracing them back to their source. When users upload a screenshot, Postcard locates the original post, fetches its live metadata, and calculates a **postcard score** to reveal how much the content has drifted from the truth.

### Core problem

Screenshots strip context. Cropped text, missing timestamps, and altered engagement counts make it easy to spread misinformation. Postcard restores that context by finding the primary source and auditing it for forensic consistency.

### Out of scope

- Tracing multi-step attribution chains.
- Wayback Machine historical lookups (deferred for MVP).
- Mobile application (web-first for hackathon).

## Architecture

Postcard operates as a forensic pipeline designed to audit social media content. While the system supports screenshot-to-URL resolution, the primary focus is the **URL-based entrypoint**, where users submit a direct post URL for deep forensic verification.

### Forensic pipeline

1. **URL Entrypoint:** Users submit the direct source URL for forensic verification.
2. **Strategy-Based Ingest:** A platform-aware `UnifiedPostStrategy` delegates to specialized **UnifiedPostClients** (Reddit, YouTube oEmbed) or Jina Reader for high-fidelity data retrieval.
3. **Forensic Audit:** Validation of origin, temporal alignment, and engagement consistency using live metadata.
4. **Corroboration:** Deep search across trusted domains (X, Reddit, News) to verify claims.

### Stages

#### Preprocessor

The preprocessor uses **sharp** to normalize contrast, adjust brightness, and sharpen the image. This optimization ensures high-quality OCR results during resolution.

#### Inference

Gemini 2.5/3+ analyzes the processed image to extract structured metadata and **infer the social media platform** (X, YouTube, Reddit, Instagram, or 'Other'). This inference is critical for direct search dorking.

#### Navigator

The navigator agent triangulates the source URL using OCR metadata and platform clues. It generates targeted search queries and prioritizes primary sources over aggregators.

**Content Ingestion (UnifiedPost Strategy):** To ensure maximum reliability and bypass common "login required" blocks, Postcard uses a **Strategy Pattern** for data ingestion. The system inspects the URL and delegates to the most robust **UnifiedPostClient**:

- **Reddit Strategy:** Uses the native `.json` endpoint for character-perfect markdown.
- **YouTube Strategy:** Uses oEmbed for video metadata and shadow scrapers for community posts.
- **Social oEmbed (X, TikTok, Instagram):** Leverages official oEmbed APIs to capture high-fidelity metadata (author names, absolute timestamps) even when direct scraping is blocked.
- **Jina Fallback:** Acts as a high-fidelity markdown scraper for general websites.

This stage produces a **UnifiedPost** object, standardizing the "ground truth" for the forensic audit. When ingestion is blocked by a platform, the UI provides transparency by displaying the raw markdown retrieved during the attempt.

#### Auditor

Playwright scrapes the live URL to compute the final forensic subscores. Using an allowlist of trusted domains, the auditor performs **Google Dorking** to identify primary sources (news articles, official statements, repository logs) that verify or refute the post's content.

## Database / Caching

Postcard uses **Drizzle ORM** with **Turso/libSQL** for type-safe server-side caching and forensic log storage.

### Caching strategy

Postcard caches forensic results at the **Resolved Post URL** level.

- **Cache Check:** Postcard queries the `posts` table for the resolved URL.
- **Cache Hit:** Increment the `hits` count on the associated `analysis`. Serve cached forensic data and the postcard score.
- **Cache Miss:** Scrape via Jina Reader, perform full corroboration, and persist a new forensic record.

## Score logic

The system combines subscores into a weighted percentage (0–100%) to provide a high-fidelity forensic verdict.

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

| Method   | Path                  | Description                                                                                     |
| :------- | :-------------------- | :---------------------------------------------------------------------------------------------- |
| **GET**  | `/postcards?url=`     | SSR page - displays forensic report for the given URL (or initiates new analysis if not cached) |
| **GET**  | `/api/postcards?url=` | API with content negotiation - returns JSON if `Accept: application/json`, otherwise redirects  |
| **POST** | `/api/postcards`      | Submit post URL and start forensic SSE stream                                                   |

### API design decisions

- **Content negotiation:** The `GET /api/postcards?url=` endpoint supports content negotiation. If the request includes `Accept: application/json`, it returns a JSON response with the forensic report. Otherwise, it redirects to the SSR page at `/postcards?url=`.
- **URL-based entrypoint:** Users submit the direct source URL via query parameter (`?url=`) for deep forensic verification.
- **SSE streaming:** The `POST /api/postcards` endpoint accepts a JSON body (e.g., `{ "url": "..." }`) and streams progress events via Server-Sent Events (SSE).
