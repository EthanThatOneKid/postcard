# Postcard design document

> **Team:** Ethan (lead) + Yves  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Stack:** Next.js · Gemini 2.5/3+ · AI SDK v6 · Drizzle ORM + Turso/libSQL · Jina Reader

---

## Project vision

Postcard reverses the entropy of social media screenshots by tracing them back to their source. When users upload a screenshot, Postcard locates the original post, fetches its live metadata, and calculates a **Postmark score** to reveal how much the content has drifted from the truth.

### Core problem
Screenshots strip context. Cropped text, missing timestamps, and altered engagement counts make it easy to spread misinformation. Postcard restores that context by finding the primary source and auditing it for forensic consistency.

### Out of scope
- Tracing multi-step attribution chains.
- Wayback Machine historical lookups (deferred for MVP).
- Mobile application (web-first for hackathon).

---

## Technical architecture

Postcard operates as a sequential pipeline using **AI SDK v6** for structured forensic extraction and grounding.

### Pipeline stages

#### 1. Image preprocessor
The preprocessor uses **Sharp** to normalize contrast, adjust brightness, and sharpen the image. This optimization ensures high-quality OCR results in the next stage.

#### 2. OCR and postmark extraction
Gemini 2.5/3+ analyzes the processed image to extract structured metadata into a **Postmark** object.

```typescript
import { z } from 'zod';

export const PostmarkSchema = z.object({
  username: z.string().optional().describe('Found handles like @username'),
  timestampText: z.string().optional().describe('Relative or absolute timestamp (e.g. "2h ago")'),
  platform: z.enum(['X', 'YouTube', 'Reddit', 'Instagram', 'Other']).default('Other'),
  engagement: z.object({
    likes: z.string().optional(),
    retweets: z.string().optional(),
    views: z.string().optional(),
  }).optional(),
  mainText: z.string().describe('The primary text content of the post'),
});
```

#### 3. Navigator agent
The navigator agent synthesizes high-precision search queries from the postmark metadata. It uses the AI SDK `googleSearch` tool to triangulate candidate source URLs.

**Jina Reader integration:** Once the agent identifies a candidate URL, it uses the **Jina Reader API** (`https://r.jina.ai/<url>`) to fetch the full page content as LLM-ready Markdown. This process ensures the system captures the full forensic context (character-by-character text, exact timestamps) while stripping away noise like ads or navigation bars.

**Google dorking strategy:** The agent acts as a Google dork expert, using site-specific operators to narrow the search space:

| Platform | Operator Example | Purpose |
| :--- | :--- | :--- |
| **X (Twitter)** | `site:twitter.com intext:"exact phrase"` | Find specific posts by content. |
| **YouTube** | `site:youtube.com "video title"` | Locate specific video descriptions. |
| **Reddit** | `site:reddit.com/r/subreddit "thread title"` | Narrow to specific communities. |
| **Instagram** | `site:instagram.com "caption text"` | Trace visual posts with text clues. |

#### 4. Multimodal auditor
The auditor compares the original screenshot against the Jina-rendered Markdown and search results. It calculates scores for origin reachability, temporal consistency (60-second window match), and visual signature alignment (platform-specific icons and layouts identified from the screenshot).

---

## Database schema

Postcard uses **Drizzle ORM** with **Turso/libSQL** for type-safe server-side caching and forensic log storage. This ensuring high performance with zero cold-start penalties in serverless environments.

### Entity relationship diagram

```mermaid
erDiagram
    analyses {
        text id PK
        text status
        text created_at
    }
    screenshots {
        text id PK
        text analysis_id FK
        text sha256 UNIQUE
        blob data
    }
    posts {
        text id PK
        text analysis_id FK
        text url
        text platform
        text post_text
    }
    judgments {
        text id PK
        text analysis_id FK
        text subscore_type
        real score
        text reasoning
    }

    analyses ||--o{ screenshots : "contains"
    analyses ||--o{ posts : "resolves to"
    analyses ||--o{ judgments : "receives"
```

### Drizzle schema definition

```typescript
import { sqliteTable, text, real, blob } from 'drizzle-orm/sqlite-core';

export const analyses = sqliteTable('analyses', {
  id: text('id').primaryKey(),
  status: text('status').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const screenshots = sqliteTable('screenshots', {
  id: text('id').primaryKey(),
  analysisId: text('analysis_id').references(() => analyses.id),
  sha256: text('sha256').unique().notNull(),
  data: blob('data').notNull(),
});

export const judgments = sqliteTable('judgments', {
  id: text('id').primaryKey(),
  analysisId: text('analysis_id').references(() => analyses.id),
  subscoreType: text('subscore_type').notNull(),
  score: real('score').notNull(),
  reasoning: text('reasoning'),
});
```

### Tooling & Migrations

- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [Turso/libSQL](https://turso.tech/)
- **CLI:** `drizzle-kit` for schema pushing and migrations.

```bash
# Apply schema changes to Turso
npx drizzle-kit push
```

---

## Postmark score logic

The system combines subscores into a weighted percentage (0–100%).

### Weighted formula
```javascript
// Score weights are arbitrary for the hackathon and easily adjustable.
const WEIGHTS = {
  ORIGIN:   0.40, // URL reachability
  TEMPORAL: 0.30, // Timestamp consistency
  VISUAL:   0.30, // UI fingerprint alignment
};

const TotalScore = (O * WEIGHTS.ORIGIN) + (T * WEIGHTS.TEMPORAL) + (V * WEIGHTS.VISUAL);
```

### Subscore definitions
- **Origin (O):** Binary check. Is the source URL reachable and platform-consistent?
- **Temporal (T):** Proximity check. Does the screenshot timestamp match the metadata found online?
- **Visual (V):** UI audit. Do buttons, logos, and layout match the expected platform's "fingerprint"?

---

## User interface

- **Minimalist dark mode:** Postcard uses a sleek black background with vibrant accent colors for scores.
- **Drag-and-drop:** Users upload screenshots via a central landing zone.
- **Real-time audit log:** The dashboard displays live updates (e.g., "Synthesizing queries...", "Auditing source...") to keep users engaged.
- **Progressive disclosure:** The interface shows the high-level score first, then allows users to expand for a detailed subscore breakdown and LLM reasoning.

---

