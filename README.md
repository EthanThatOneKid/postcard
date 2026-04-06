# Postcard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![AI SDK](https://img.shields.io/badge/AI_SDK-6.0-black)](https://sdk.vercel.ai/)
[![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Turso](https://img.shields.io/badge/Turso-202020?logo=turso&logoColor=white)](https://turso.tech/)
[![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?logo=drizzle&logoColor=000)](https://orm.drizzle.team/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)

> _Trace the Truth._

![Postcard Illustration](./public/postcard-illustration.png)

Postcard is a digital forensics tool dedicated to tracing viral content back to its definitive source. By auditing how much a post has drifted from the ground truth, it calculates a **Postcard Score** to restore credibility in the post-truth era.

## Hackathon submission

**Track.** [Cybersecurity](https://pantherhacks2026.devpost.com/)
**Submission.** [Devpost](https://devpost.com/software/postcard-bpx2mz)
**Demo.** [postcard.fartlabs.org](https://postcard.fartlabs.org)

## Pipeline architecture

```mermaid
sequenceDiagram
    participant U as Verification Platform (/postcards)
    participant API as API Route (/api/postcards)
    participant P as Forensic Pipeline
    participant I as UnifiedPostStrategy (oEmbed/Jina)
    participant C as Corroborator Agent (Gemini)
    participant V as Verifier Agent (Gemini)
    participant DB as Database (Turso)

    U->>API: POST /api/postcards { url: "https://x.com/..." }
    API-->>U: HTTP 202 { postcardId, status: "processing" }

    API->>P: processPostcardFromUrl(url, postcardId)
    P->>DB: Update progress (stage, message, progress)

    alt Cache Hit
        DB-->>P: Return cached report
    else Cache Miss
        P->>I: unifiedPostClient.fetch(url)
        I-->>P: High-fidelity Markdown
        P->>DB: Update progress (stage: "scraping", progress: 0.1)

        P->>C: corroboratePostcard(content)
        C-->>P: Independent Evidence & Verdict
        P->>DB: Update progress (stage: "corroborating", progress: 0.4)

        P->>V: auditPostcard(url, postcard)
        V-->>P: Origin & Temporal Scores
        P->>DB: Update progress (stage: "auditing", progress: 0.7)

        P->>P: Calculate Postcard Score
        P->>DB: Persist analysis (status: "completed", progress: 1)
    end

    P-->>API: PostcardResponse + ForensicReport
    API-->>U: (via polling)

    Note over U: Polls GET /api/postcards?url=...<br/>every 3 seconds for status
    Note over U: When status="completed", displays report
```

## User flow

Users enter a post URL, which triggers the forensic pipeline. Postcard then displays a **Postcard Score** and a detailed subscore breakdown.

Postcard prioritizes the direct URL entrypoint to ensure absolute forensic precision, while maintaining support for screenshot-to-URL resolution as an additional quality-of-life feature.

## Product overview

Postcard is a digital forensics pipeline that takes a social media post URL, traces it back to its original source, and produces a **Postcard Score** (0–100%) measuring how much the content has drifted from the truth.

> _Trace the Truth._

## The problem

Screenshots strip all context. By the time something goes viral, it's been cropped, captioned, and misattributed. Postcard utilizes the **"Wisdom of the Crowd"** to triangulate the primary source and audit it for forensic consistency—providing a scalable solution for restoring context and credibility.

### Our solution

We built a 4-stage forensic pipeline focused on deep audit log generation and corroboration for social media posts:

- **Multimodal ingest.** Postcard utilizes Jina Reader to ingest live content and metadata, establishing the "ground truth" for the forensic audit.
- **Forensic audit.** Postcard uses Playwright to perform direct site checks, verifying origin and ensuring temporal alignment with the reported narrative.
- **Corroboration engine.** Postcard performs deep search across trusted domains to verify claims and find mentions of the content elsewhere to determine its "drift."
- **Verification platform.** Built with Next.js and Tailwind CSS, providing a clean, terminal-inspired interface for quick, simple forensic verification.

## Documentation

- [docs/SUBMISSION.md](docs/SUBMISSION.md). PantherHacks 2026 submission summary, pitch script, and demo links.
- [docs/DESIGN.md](docs/DESIGN.md). Full technical specification, architecture, and pipeline stages.
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). Development environment setup, manual testing guide, and style guide.
- [docs/API.md](docs/API.md). Public API reference and standard polling patterns.
- [public/openapi.json](public/openapi.json). OpenAPI v3.1 Specification for SDK generation.

---

Built with 🐈‍⬛ at [PantherHacks 2026](https://pantherhacks2026.devpost.com/)
