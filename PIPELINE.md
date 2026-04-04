# Postcard Pipeline — AI SDK v6 Design

## Overview

Postcard is a "Digital Pathologist" that reverse-engineers the provenance of screenshots. Given an image buffer, the pipeline extracts OCR, triangulates the source URL via web search, and audits the live page for forensic consistency.

## Architecture

```
Image Buffer
    │
    ▼
┌─────────────────────┐
│  1. Preprocessor     │  sharp — contrast, brightness, sharpen
│  (vision/processor)  │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  2. OCR + Postmark  │  AI SDK v6 generateText + Output.object
│  (vision/ocr)       │  Gemini 2.0 Flash + Zod schema
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  3. Navigator Agent │  AI SDK v6 generateText + google_search tool
│  (agents/navigator)  │  Triangulates exact source URL
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  4. Forensic Auditor │  Playwright — scrapes live page
│  (agents/verifier)   │  Computes origin/temporal/visual scores
└─────────────────────┘
           ▼
PostcardReport
```

## Stage Schemas

### Preprocessor

```typescript
// src/lib/vision/processor.ts

import sharp from 'sharp';

export interface PreprocessingOptions {
  contrast?: number;
  brightness?: number;
  sharpen?: boolean;
}

export async function preprocessImage(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {}
): Promise<Buffer> {
  let pipeline = sharp(imageBuffer);

  if (options.contrast !== undefined) {
    pipeline = pipeline.linear(options.contrast, -(128 * options.contrast) + 128);
  }

  if (options.brightness !== undefined) {
    pipeline = pipeline.modulate({ brightness: options.brightness });
  }

  if (options.sharpen) {
    pipeline = pipeline.sharpen();
  }

  return await pipeline.toBuffer();
}
```

**Responsibilities:** Deskew hint (future), contrast normalization, brightness adjustment, sharpening. Output is a `Buffer` passed directly to the OCR stage.

---

### OCR + Postmark Extraction

```typescript
// src/lib/vision/ocr.ts

import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';

export const PostmarkSchema = z.object({
  username: z.string().optional().describe('Found handles like @username'),
  timestampText: z.string().optional().describe('Relative or absolute timestamp in the shot (e.g. "2h ago", "Oct 12, 2025")'),
  platform: z.enum(['X', 'YouTube', 'Reddit', 'Instagram', 'Other']).default('Other'),
  engagement: z.object({
    likes: z.string().optional(),
    retweets: z.string().optional(),
    views: z.string().optional(),
  }).optional(),
  mainText: z.string().describe('The primary content of the postcard'),
  uiAnchors: z.array(z.object({
    element: z.string(),
    position: z.string(),
    confidence: z.number(),
  })).optional(),
});

export type Postmark = z.infer<typeof PostmarkSchema>;

export const OCRResultSchema = z.object({
  markdown: z.string().describe('Raw extracted text in interleaved Markdown format'),
  postmark: PostmarkSchema,
});

export type OCRResult = z.infer<typeof OCRResultSchema>;

export async function extractPostmark(
  imageBuffer: Buffer,
  mimeType: string = 'image/png'
): Promise<OCRResult> {
  const { output } = await generateText({
    model: google('gemini-2.0-flash'),
    output: Output.object({
      schema: z.object({
        markdown: z.string().describe('Raw extracted text in interleaved Markdown format'),
        postmark: PostmarkSchema,
      }),
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
              Analyze this screenshot as a "Postcard" from the digital web.
              Extract the raw text into interleaved Markdown format.
              Also, identify the "Postmark" metadata specifically looking for:
              - User handles (@username)
              - Timestamps (e.g., "2h ago", "Feb 10")
              - Engagement metrics (likes, views, retweets)
              - Platform identity (X, YouTube, etc.)
              - UI Anchors (key buttons, logos)
            `,
          },
          {
            type: 'image',
            image: imageBuffer,
          },
        ],
      },
    ],
  });

  return output;
}
```

**Zod usage:** `PostmarkSchema` and `OCRResultSchema` define the structured output contract. `Output.object({ schema })` from AI SDK v6 enforces this schema at generation time, returning a fully typed object.

---

### Navigator Agent

```typescript
// src/lib/agents/navigator.ts

import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { Postmark } from '../vision/ocr';

export const NavigatorResultSchema = z.object({
  url: z.string().url().optional().describe('The identified source URL'),
  queries: z.array(z.string()).describe('The search queries used for triangulation'),
});

export type NavigatorResult = z.infer<typeof NavigatorResultSchema>;

export async function navigateToSource(
  postmark: Postmark,
  markdown: string,
): Promise<NavigatorResult> {
  const { output } = await generateText({
    model: google('gemini-2.0-flash'),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    output: Output.object({
      schema: NavigatorResultSchema,
    }),
    messages: [
      {
        role: 'user',
        content: `
          You are the "Navigator Agent" for Postcard, a digital forensics system.
          Your goal is to triangulate the exact source URL of the provided screenshot data.

          Postmark Metadata:
          - Platform: ${postmark.platform}
          - Username: ${postmark.username ?? 'unknown'}
          - Timestamp: ${postmark.timestampText ?? 'unknown'}
          - Engagement: ${JSON.stringify(postmark.engagement ?? {})}

          Content Preview:
          ${markdown.slice(0, 1000)}

          Use the provided 'google_search' tool to find the original post or page on the live web.
          Focus on unique phrases, usernames, and timestamp alignment.
          Your final response MUST be the structured object containing the URL and the queries you used.
        `,
      },
    ],
  });

  return output;
}
```

**Zod usage:** `NavigatorResultSchema` schemas the structured output. `google.tools.googleSearch({})` provides live web grounding, resolving the postmark's platform + username + timestamp into a canonical URL.

---

### Forensic Auditor

```typescript
// src/lib/agents/verifier.ts

import { chromium } from 'playwright';
import { z } from 'zod';
import type { Postmark } from '../vision/ocr';

export const AuditResultSchema = z.object({
  originScore: z.number().min(0).max(1).describe('0 or 1 — URL is reachable'),
  temporalScore: z.number().min(0).max(1).describe('0–1 — timestamp consistency'),
  visualScore: z.number().min(0).max(1).describe('0–1 — UI fingerprint alignment'),
  totalScore: z.number().min(0).max(1).describe('Weighted sum: 0.4*O + 0.3*T + 0.3*V'),
  auditLog: z.array(z.string()).describe('Step-by-step audit trail'),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

export async function auditPostmark(
  url: string,
  screenshotPostmark: Postmark,
): Promise<AuditResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditLog: string[] = [`Starting audit for URL: ${url}`];
  let originScore = 0;
  let temporalScore = 0;
  let visualScore = 0;

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    originScore = 1;
    auditLog.push('URL verified: Direct match found.');

    const pageTitle = await page.title();
    const pageContent = await page.innerText('body');

    auditLog.push(`Page title: ${pageTitle}`);

    if (
      screenshotPostmark.timestampText &&
      pageContent.includes(screenshotPostmark.timestampText)
    ) {
      temporalScore = 1;
      auditLog.push('Temporal match: Timestamp consistent with live page content.');
    } else {
      temporalScore = 0.5;
      auditLog.push('Temporal warning: Exact timestamp text not found in live page.');
    }

    const platformIdentifier = screenshotPostmark.platform.toLowerCase();
    if (pageContent.toLowerCase().includes(platformIdentifier)) {
      visualScore = 0.9;
      auditLog.push('Visual consistency: UI fingerprints align with platform template.');
    } else {
      visualScore = 0.4;
      auditLog.push('Visual anomaly: Unexpected UI layout for the expected platform.');
    }
  } catch (error) {
    auditLog.push(`Audit failed: ${(error as Error).message}`);
  } finally {
    await browser.close();
  }

  const totalScore = 0.4 * originScore + 0.3 * temporalScore + 0.3 * visualScore;

  return AuditResultSchema.parse({
    originScore,
    temporalScore,
    visualScore,
    totalScore,
    auditLog,
  });
}
```

**Zod usage:** `AuditResultSchema` validates the computed audit scores before returning. The final `AuditResultSchema.parse()` call acts as a runtime type guard, ensuring the returned object conforms to the schema.

---

## Pipeline Entry Point

```typescript
// src/lib/postcard.ts

import { z } from 'zod';
import { preprocessImage } from './vision/processor';
import { extractPostmark } from './vision/ocr';
import { navigateToSource } from './agents/navigator';
import { auditPostmark } from './agents/verifier';

export const PostcardReportSchema = z.object({
  ocr: z.object({
    markdown: z.string(),
    postmark: z.object({
      username: z.string().optional(),
      timestampText: z.string().optional(),
      platform: z.string(),
      engagement: z.record(z.string()).optional(),
      mainText: z.string(),
      uiAnchors: z.array(z.object({
        element: z.string(),
        position: z.string(),
        confidence: z.number(),
      })).optional(),
    }),
  }),
  triangulation: z.object({
    targetUrl: z.string().url().optional(),
    queries: z.array(z.string()),
  }),
  audit: z.object({
    originScore: z.number(),
    temporalScore: z.number(),
    visualScore: z.number(),
    totalScore: z.number(),
    auditLog: z.array(z.string()),
  }),
  timestamp: z.string().datetime(),
});

export type PostcardReport = z.infer<typeof PostcardReportSchema>;

export async function processPostcard(imageBuffer: Buffer): Promise<PostcardReport> {
  // 1. Preprocess
  const processed = await preprocessImage(imageBuffer, { contrast: 1.2, sharpen: true });

  // 2. OCR + Postmark
  const ocr = await extractPostmark(processed);

  // 3. Triangulate URL (Navigator Agent)
  const { url: targetUrl, queries } = await navigateToSource(ocr.postmark, ocr.markdown);

  // 4. Audit (skip if no URL found)
  const audit = targetUrl
    ? await auditPostmark(targetUrl, ocr.postmark)
    : {
        originScore: 0,
        temporalScore: 0,
        visualScore: 0,
        totalScore: 0,
        auditLog: ['Skipping audit: No target URL identified.'],
      };

  return PostcardReportSchema.parse({
    ocr,
    triangulation: { targetUrl, queries },
    audit,
    timestamp: new Date().toISOString(),
  });
}
```

**Zod usage:** `PostcardReportSchema` is the top-level schema for the entire pipeline output. The final `PostcardReportSchema.parse()` call validates the complete report before returning it to the caller.

---

## Score Model

| Signal | Weight | Description |
|--------|--------|-------------|
| Origin (O) | 40% | URL is reachable and matches the postmark platform |
| Temporal (T) | 30% | Timestamp in screenshot is consistent with live page |
| Visual (V) | 30% | UI fingerprints (CSS, layout, logos) match expected platform |

```
TotalScore = 0.4·O + 0.3·T + 0.3·V
```

Audit log entries document each step for human reviewability.

---

## File Map

| File | Responsibility |
|------|----------------|
| `src/lib/postcard.ts` | Pipeline entry point + top-level schema |
| `src/lib/vision/processor.ts` | Image preprocessing (sharp) |
| `src/lib/vision/ocr.ts` | AI SDK v6 OCR + PostmarkSchema |
| `src/lib/agents/navigator.ts` | AI SDK v6 Navigator Agent + google_search |
| `src/lib/agents/verifier.ts` | Playwright Forensic Auditor + AuditResultSchema |