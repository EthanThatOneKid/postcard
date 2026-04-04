# Postcard

> *Trace every post back to its source.*

Postcard is a digital forensics tool that takes a screenshot of a social media post and traces it to its origin — calculating how much the content has drifted from the original along the way.

**Track:** PantherHacks 2026 — Cybersecurity  
**Team:** Ethan + Yves  
**Stack:** Next.js · Gemini (Google AI) · Toolhouse · LangGraph

---

## What It Does

1. **Upload** a screenshot of any social media post
2. **Vision parse** — Gemini extracts text, handles, timestamps, engagement counts
3. **Navigator agent** — synthesizes high-precision search queries to find the primary source
4. **Forensic verifier** — checks source URL, timestamp consistency, visual fingerprints
5. **Postmark Score** + **Travel Log** — the verdict and the content's full path

---

## Postmark Score

```
S = (w₁ · Origin) + (w₂ · Temporal) + (w₃ · Visual)
```

| Score | Label | Meaning |
|-------|-------|---------|
| 0.9+ | ✅ Verified Origin | Primary source confirmed |
| 0.5–0.9 | ⚠️ Unreliable Postmark | Modified, parodied, or detunneled |
| < 0.5 | 🔴 Fabricated | Fabricated or heavily manipulated |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Postcard                             │
│                                                           │
│  Upload ──► Vision Parse ──► Navigator ──► Verdict      │
│   (UI)     (Gemini)        (Agent)        (Score + Log)  │
└──────────────────────────────────────────────────────────┘
```

### Component A — Vision Parser
- Model: Gemini 2.0 Flash (with Google Search grounding)
- Extracts: text, @handles, timestamps, view/like counts

### Component B — Navigator Agent
- Model: GPT-4o or Claude 3.5 Sonnet
- Synthesizes OCR data into precise search queries
- Multi-turn verification loop via LangGraph

### Component C — Forensic Verifier
- Live fetch + Wayback Machine API for archived snapshots
- Temporal consistency check
- Visual fingerprint comparison

---

## Quick Start

```bash
git clone https://github.com/EthanThatOneKid/postcard.git
cd postcard
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY to .env.local
npm run dev
```

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js | Responsive dashboard, easy API routes |
| AI / Vision | Gemini 2.0 Flash | Native vision + Google Search built-in |
| Agentic | LangGraph | Stateful multi-turn verification loops |
| Search | Toolhouse | Seamless browser/search tool integration |
| Storage | Milvus / Pinecone | Vector DB for UI fingerprints |

---

## File Structure

```
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
