# Postcard

> _Trace every post back to its source._

![Forensic Dashboard Mockup](./public/mockup.png)

**Postcard** is a digital forensics tool that takes a screenshot of a social media post and traces it back to its definitive origin—calculating a **postcard score** of credibility by auditing how much the content has drifted from the primary source.

---

## 🏆 PantherHacks 2026 Submission

**Track:** [Cybersecurity / OSINT](https://pantherhacks2026.devpost.com/)  
**Challenge:** Rebuilding trust in a "post-truth" digital era.  
**Pitch Script:** [View Video Script](./PITCH.md)

### The Problem
Screenshots are the primary currency of misinformation. They strip context, remove timestamps, and are trivially easy to manipulate. Postcard reverses this digital entropy by finding the primary source and performing a multi-stage forensic audit.

### The Solution: The "Postmark" Pipeline
We built a 4-stage forensic pipeline that analyzes the "DNA" of a screenshot rather than just its pixels:
1. **Vision Inference:** Gemini extracts handles, timestamps, and engagement "fingerprints."
2. **Grounded Navigation:** Synthesizes high-precision search queries to find the source URL.
3. **Multimodal Scrape:** Jina Reader ingest live content to verify consistency.
4. **Corroboration Audit:** Deep search across trusted domains (X, Reddit, News) to verify claims.

---

## 🚀 AI Developer Experience

To build a system this complex in a 48-hour hackathon, we leaned heavily on **[Vercel AI SDK v6](https://sdk.vercel.ai/)**. 

> [!TIP]
> **Shout out to Vercel:** We utilized the new **AI SDK Skills** to maintain industry-standard best practices. These localized intelligence folders allowed our agentic AI assistants to follow the latest idiomatic patterns for `streamText`, `toolCall` payloads, and multi-step grounding, ensuring 100% type-safety throughout the forensic pipeline.

---

## 🛠️ Technical Stack

| Layer          | Choice                     | Why                                                 |
| -------------- | -------------------------- | --------------------------------------------------- |
| **Frontend**   | Next.js 16 (Futuristic!)   | Responsive dashboard and high-performance API.      |
| **AI / Vision**| Google Gemini              | Native multimodal vision + Search grounding.        |
| **Orchestration**| Vercel AI SDK v6         | Robust tool calling and typed stream iteration.     |
| **Storage**    | Drizzle + Turso            | Type-safe libSQL persistence for forensic logs.     |

---

## 🏗️ Quick Start

```bash
git clone https://github.com/EthanThatOneKid/postcard.git
cd postcard
npm install
npm run check  # Verify type-safety and linting
npm run dev
```

For the full technical specification, see the **[DESIGN.md](DESIGN.md)**.
