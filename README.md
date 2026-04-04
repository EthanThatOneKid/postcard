# Postcard

> _Trace every post back to its source._

![Forensic Dashboard Mockup](./public/mockup.png)

## The problem

Screenshots are the primary currency of misinformation. They strip context, remove timestamps, and are easily manipulated. A viral screenshot often removes the original author's byline, date, and any subsequent corrections. Postcard reverses this entropy by finding the primary source and auditing it for forensic consistency.

**Event:** [PantherHacks 2026](https://pantherhacks2026.devpost.com/) — Cybersecurity  
**Team:** Ethan + Yves  
**Stack:** Next.js · Gemini (Google AI) · AI SDK v6 · Drizzle ORM + Turso/libSQL

## PantherHacks 2026 submission

## What it does

1. **Upload** a screenshot of any social media post.
2. **Vision parse** — Gemini extracts text, handles, timestamps, and engagement counts.
3. **Navigator agent** — Gemini synthesizes high-precision search queries to find the primary source.
4. **Multimodal auditor** — Gemini verifies the source URL, timestamp consistency, and visual fingerprints.
5. **postcard score** — The system calculates the final verdict and provides a forensic audit trail.

## How it works

**User flow:** Enter Post URL → Forensic Pipeline Runs → Postcard Score + Subscore Breakdown appears.

For the full technical specification, including Zod schemas, database ERD, and component breakdown, see the **[design document](DESIGN.md)**.

## What it does

**Postcard** is a digital forensics pipeline that takes a social media post URL, traces it back to its original source, and produces a **postcard score (0–100%)** measuring how much the content has drifted from the truth.

> _Trace every post back to its source._

## The problem

Screenshots strip all context. By the time something goes viral, it's been cropped, captioned, and misattributed. A screenshot of a tweet looks nothing like the original tweet. Postcard reverses this entropy by finding the primary source and auditing it for forensic consistency.

| Layer         | Choice                     | Why                                                 |
| ------------- | -------------------------- | --------------------------------------------------- |
| Frontend      | Next.js                    | Responsive dashboard and fast API routes.           |
| AI / Vision   | Gemini 2.5/3               | Native vision and Google Search grounding built-in. |
| Orchestration | AI SDK v6                  | Idiomatic structured output and tool integration.   |
| Storage       | Drizzle ORM + Turso/libSQL | Type-safe persistence with low cold-start SQLite.   |

We built a 4-stage forensic pipeline focused on deep audit log generation and corroboration for social media posts:

## Roadmap

Implementation progress is tracked via the **[GitHub roadmap issue #12](https://github.com/EthanThatOneKid/postcard/issues/12)**.

## Project structure

All technical documentation is consolidated in **[DESIGN.md](DESIGN.md)**.

```bash
postcard/
├── DESIGN.md          # Full design doc
├── README.md          # This file
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing + upload
│   │   ├── dashboard/page.tsx
│   │   └── api/process/
│   │       └── route.ts     # Trace endpoint
│   ├── lib/
│   │   ├── vision/
│   │   │   ├── processor.ts  # Image preprocessing
│   │   │   └── ocr.ts       # Gemini vision OCR
│   │   ├── agents/
│   │   │   ├── navigator.ts # Search query synthesis
│   │   │   └── verifier.ts  # Forensic checks
│   │   └── postcard.ts      # Core scoring logic
```
