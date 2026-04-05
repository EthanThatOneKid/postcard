# Postcard technical design

> **Team:** [Ethan](https://github.com/EthanThatOneKid), [Yves](https://github.com/hallowsyves)  
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

## Technical architecture

Postcard operates as a forensic pipeline designed to audit social media content. While the system supports screenshot-to-URL resolution, the primary focus is the **URL-based entrypoint**, where users submit a direct post URL for deep forensic verification.

### Forensic pipeline (URL entrypoint)

1. **URL Entrypoint:** Users submit the direct source URL for forensic verification.
2. **Multimodal Ingest:** Jina Reader fetches the live content to establish ground truth.
3. **Forensic Audit:** Playwright and direct site checks verify origin and temporal alignment.
4. **Corroboration:** Deep search across trusted domains (X, Reddit, News) to verify claims.

### Pipeline stages

#### Stage 1: preprocessor

The preprocessor uses **sharp** to normalize contrast, adjust brightness, and sharpen the image. This optimization ensures high-quality OCR results during resolution.

#### Stage 2: OCR and platform inference

Gemini 2.5/3+ analyzes the processed image to extract structured metadata and **infer the social media platform** (X, YouTube, Reddit, Instagram, or 'Other'). This inference is critical for direct search dorking.

#### Stage 3: navigator agent

The navigator agent triangulates the source URL using OCR metadata and platform clues. It generates targeted search queries and prioritizes primary sources over aggregators.

**Content Ingestion (Jina Reader):** Once a URL is provided (or resolved), the system uses the **Jina Reader API** (`https://r.jina.ai/<url>`) to ingest the **live metadata** (exact like counts, character-by-character text, absolute timestamps). This serves as the "ground truth" for the forensic audit.

#### Stage 4: forensic auditor

Playwright scrapes the live URL to compute the final forensic subscores. Using an allowlist of trusted domains, the auditor performs **Google Dorking** to identify primary sources (news articles, official statements, repository logs) that verify or refute the post's content.

## Database and caching

Postcard uses **Drizzle ORM** with **Turso/libSQL** for type-safe server-side caching and forensic log storage.

### Caching strategy

Postcard caches forensic results at the **Resolved Post URL** level.

- **Cache Check:** Postcard queries the `posts` table for the resolved URL.
- **Cache Hit:** Increment the `hits` count on the associated `analysis`. Serve cached forensic data and the postcard score.
- **Cache Miss:** Scrape via Jina Reader, perform full corroboration, and persist a new forensic record.

## The postcard score model

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

## REST API architecture

Postcard follows **Google AIP-121** (Resource-Oriented Design) and **AIP-122** (Standard Methods).

### Endpoints

| Method   | Path                  | Description                                      |
| :------- | :-------------------- | :----------------------------------------------- |
| **POST** | `/api/postcards`      | Submit post URL and start forensic SSE stream.   |
| **GET**  | `/api/postcards/{id}` | Retrieve the analysis result and postcard score. |

### API design decisions

- **JSON-body for SSE:** The `POST /api/postcards` endpoint accepts a JSON body (e.g., `{ "url": "..." }`) rather than URL search parameters. This simplifies the OpenAPI specification and ensures robust handling of complex or long URLs.
