# Postcard — Design Document

> **Team:** Ethan (lead) + Yves  
> **Event:** PantherHacks 2026 (April 3–5, 2026)  
> **Track:** Cybersecurity  
> **Repository:** `postcard`  
> **Stack:** TBD — this doc drives that decision

---

## 1. Concept & Vision

**Tagline:** *Trace every post back to its source.*

Postcard is a digital forensics tool that takes a screenshot or image of a social media post, traces it to its origin, and scores how much the post has drifted from its primary source. We visualize information flow the same way a postcard gets stamped and routed through postal systems — except our stamps are metadata, our routing is search triangulation, and our delivery confirmation is a **Postmark Score**.

**Core insight:** Most people can't tell if what they saw online is real. Screenshots strip away all context — timestamp, handle, URL — and by the time something goes viral it's been cropped, captioned, and misattributed. Postcard reverses that entropy.

**Emotional target:** The user sees something viral, feels uneasy about it, and comes to Postcard to find out: *is this real, where did it come from, and how much has it been twisted?*

---

## 2. Hackathon Constraints

- **Timebox:** ~48 hours (April 3–5)
- **Team size:** 2–4 people
- **Goal:** Functional demo that judges can interact with
- **Judging criteria:** Likely originality, technical difficulty, real-world utility, presentation

**Strategy:** Ship a working end-to-end flow — upload → analyze → report — even if the underlying models are lightweight. Polish the "aha moment" (the Postmark Score + travel log visualization).

---

## 3. The Postcard Pipeline

```
User Screenshot
      │
      ▼
┌─────────────────────┐
│  OCR + Vision Parse │  ← Gemini 2.0 Flash (or Mistral OCR)
│  Extract: text,     │
│  handles, timestamps│
│  engagement counts  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Triangulation      │  ← Google Search via Gemini API
│  Agent               │     (site: filters, keyword extraction)
│  Build search query  │
│  Find source URL     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Forensic Verifier  │  ← Live scrape + Wayback Machine
│  3-way comparison:   │
│   1. URL match?      │
│   2. Timestamp       │
│      consistent?     │
│   3. UI fingerprint  │
│      (platform CSS)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Postmark Score     │
│  + Travel Log       │
│  + Bias Report      │
└─────────────────────┘
```

---

## 4. Postmark Score

A weighted confidence score S ∈ [0, 1]:

```
S = (w₁ · O) + (w₂ · T) + (w₃ · V)

O = Origin:      Exact URL match found?        (binary 0/1)
T = Temporal:    Timestamp consistent?         (0–1 scale)
V = Visual:      UI/layout matches platform?  (0–1 scale)
```

**Thresholds:**

| Score  | Label                | Meaning                          |
|--------|----------------------|----------------------------------|
| S > 0.9 | ✅ Verified Origin   | Primary source confirmed         |
| 0.5–0.9 | ⚠️ Unreliable Postmark | Modified, parodied, or detunneled |
| S < 0.5 | 🔴 Fabricated        | Fabricated or highly manipulated |

---

## 5. UI / UX — The "Travel Log"

When Postcard finishes analysis, it presents a **Travel Log** — a visual timeline of how the content moved:

1. **The Source** — Original post with verified URL, timestamp, platform
2. **The Deratives** — Reposts, screenshots, edits found in the wild
3. **The Semantic Diff** — What changed between source and derivative (caption, handle, crop, context)
4. **Bias Indicator** — How the framing shifted at each hop

**Design goal:** The UI should feel like tracing a package — satisfying, informative, clear about what it found and didn't find.

---

## 6. Technical Approach

### Frontend
- **Next.js** or plain HTML/JS (timebox constraint — simplicity wins)
- Drag-and-drop image upload
- Animated score reveal
- Travel log as a vertical timeline

### Vision / OCR
- **Gemini 2.0 Flash** via `generativeLanguage` API — use `parts` mode for image input
- Fallback: base64 image in prompt, no OCR dependency
- Extract: `@handles`, timestamps, engagement, logos, platform UI cues

### Search / Triangulation
- **Google Search tool** in Gemini (built-in `googleSearch` tool)
- Gemini gets a system prompt as "Navigator Agent" — instructions to generate precise search queries from OCR output
- Returns: candidate source URLs ranked by relevance

### Verification
- **Live scrape** of candidate URL via `curl` or `fetch` — compare metadata
- **Wayback Machine** API for historical timestamps
- **UI fingerprinting** — if time permits, compare CSS/colors to platform baseline (stretch goal)

### Scoring
- All scoring logic runs client-side or in a single API route
- Gemini writes the bias/narrative summary; deterministic scoring in JS

---

## 7. Navigator Agent — System Prompt

```
You are the Postcard Navigator Agent. Your job is to take OCR output from a social media screenshot and synthesize precise search queries to find the original source.

INPUT FORMAT:
- Extracted text (could be caption, comment, post body)
- Platform clues (YouTube UI, X/Twitter blue check, Reddit upvote icon, etc.)
- Any @handles, timestamps, or engagement counts found

YOUR TASK:
1. Identify the most search-dense phrase from the text (the "hook")
2. Combine with platform context and handles to build 2–3 targeted queries
3. Prioritize exact-match searches using quotes and site: operators
4. Return ranked candidate URLs

EXAMPLES:
OCR: "I bought the moon" + YouTube UI detected
Query: site:youtube.com "I bought the moon" MrBeast

OCR: Screenshot of tweet by @someuser, text about inflation
Query: site:x.com "inflation" "someuser" 2026

OUTPUT:
Return a JSON list:
{
  "candidates": [
    { "url": "...", "query": "...", "confidence": 0.9 },
    ...
  ]
}

CONSTRAINTS:
- Maximum 3 search queries
- Prefer primary sources over news aggregators
- Bias toward recent content (last 90 days) unless timestamp in OCR suggests older
```

---

## 8. Feature Priority — 48hr Slice

### Must Ship (MVP)
- [ ] Image upload with drag-and-drop
- [ ] Vision parse via Gemini (extract text + handles + timestamps)
- [ ] Navigator agent query generation (via Gemini + Google Search)
- [ ] Live URL verification (fetch metadata from candidate)
- [ ] Postmark Score calculation
- [ ] Travel Log output with bias summary

### If Time Permits
- [ ] Wayback Machine timestamp check
- [ ] Multi-candidate ranking (show top 3 sources)
- [ ] UI fingerprinting (platform CSS comparison)
- [ ] Animated travel log visualization

---

## 9. Differentiation & "Wow" Factor

Most hackathon projects this weekend will be CRUD apps or RAG chatbots. Postcard stands out because:

1. **It's visual and interactive** — judges can upload their own screenshot and get an instant result
2. **It has a strong metaphor** — "postcard" + "travel log" + "postmark score" are immediately understandable
3. **It has real-world urgency** — misinformation is top-of-mind for everyone
4. **The demo is the story** — upload a viral tweet screenshot, watch Postcard find it, see the score drop if it's been manipulated

**Demo script:**
1. Open Postcard on screen
2. Pull up a known viral tweet on your phone
3. Screenshot it
4. Upload to Postcard
5. Watch it trace back to the original in real time
6. Show the Postmark Score and Travel Log

---

## 10. Tech Stack Decision

| Layer         | Choice                          | Reason                                           |
|---------------|---------------------------------|--------------------------------------------------|
| Frontend      | Next.js or vanilla HTML/JS      | Speed to MVP; Tailwind for styling              |
| Vision/OCR    | Gemini 2.0 Flash (image input)  | Native multimodal; Google's own Search tool built in |
| Search        | Gemini `googleSearch` tool      | Tight integration; no extra API surface          |
| Verification  | Fetch + Wayback API             | Two lines of code; high signal                  |
| Hosting       | Zo Space or deploy to Vercel    | Fastest path to live URL for demo               |

**Key API:** `generativeLanguage.googleapis.com` — configure in [Settings > Advanced](/?t=settings&s=advanced) as `GEMINI_API_KEY`.

---

## 11. Open Questions

- [ ] Do judges expect a deployed URL, or is local demo OK?
- [ ] Is there a mandatory demo video / presentation format?
- [ ] What APIs are available at the venue? (Network restrictions?)
- [ ] Should we target mobile-first or desktop? (Judges may use their phones)

---

*Last updated: 2026-04-03 17:40 UTC*
