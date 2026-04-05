# Postcard: Devpost submission

**Tagline:** Democratizing the truth. Trace every post back to its source.

---

## Inspiration

In our current "post-truth" era, information is often consumed via contextless screenshots. By the time a post goes viral, it has been cropped, captioned, and stripped of its metadata—making it nearly impossible to tell if the content is authentic or a manufactured narrative. We wanted to build a tool that acts as a digital "wayback machine" for credibility, restoring the lost link between viral content and its primary source.

## What it does

**Postcard** is a digital forensics pipeline designed to rebuild trust in online media. It takes a social media URL (or a screenshot) and traces it back to its original source. The core of the project is the **Postcard Score (0–100%)**, a credibility metric calculated by auditing how much the content has drifted from the ground truth.

### Key Features:

- **Forensic Traceability:** Automatically identifies the primary source of a claim across X, Reddit, and major news outlets.
- **Drift Analysis:** Audits content for forensic consistency, checking for temporal alignment and attribution errors.
- **Screenshot-to-URL Resolution:** A quality-of-life feature that allows users to upload a screenshot to find its live, interactive counterpart.
- **Subscore Breakdown:** Users don't just get a number; they see a breakdown of source reliability, temporal verification, and cross-platform corroboration.

## How we built it

We developed a 4-stage forensic pipeline focused on deep audit log generation:

1.  **Multimodal Ingest:** We utilized **Jina Reader** to ingest live content and establish a "ground truth" version of the post.
2.  **Forensic Audit:** Using **Playwright**, we performed direct site checks to verify the origin and ensure the timestamp aligns with the reported narrative.
3.  **Corroboration Engine:** We implemented a deep search across trusted domains to verify claims and find mentions of the content elsewhere to determine its "drift."
4.  **Frontend/API:** Built with **Next.js** and **Tailwind CSS**, providing a clean, terminal-inspired interface that reflects the tool's forensic nature.

## Challenges we ran into

The biggest hurdle was "reverse entropy"—trying to find a live URL from a static, often low-quality screenshot. Social media platforms also have aggressive bot detection, which made using Playwright for forensic verification difficult. We had to fine-tune our headers and navigation patterns to ensure we could retrieve the necessary metadata without being blocked.

## Accomplishments that we're proud of

We successfully built a functional 4-stage pipeline that does more than just "fact-check"—it performs a technical audit. Seeing the **Postcard Score** update in real-time as the corroboration engine found matching sources across different platforms was a huge "aha!" moment for the team.

## What we learned

We gained a deep appreciation for the fragility of digital metadata. We learned how easily information is manipulated once it leaves its native platform and how multimodal LLMs can be used not just for generation, but as powerful forensic tools to compare "drift" between two pieces of content.

## Key Metrics

- **Forensic Pipeline Stages:** 4
- **Postcard Score Range:** 0-100%
- **Type Safety:** 100% (TS/Lint)
- **Supported Platforms:** X, Reddit, News Articles, Screenshots

## Judging Alignment

- **Cybersecurity:** Demonstrates digital forensics and OSINT techniques to verify data integrity.
- **Innovation:** Uses multimodal LLMs for "drift analysis" rather than simple text fact-checking.
- **User Experience:** Provides a clean, terminal-inspired interface with real-time SSE progress updates.

## What's next for Postcard

- **Browser Extension:** Bringing Postcard directly into the feed, allowing users to right-click any post to see its score instantly.
- **Expanded Platform Support:** Increasing our corroboration engine to include specialized platforms like Telegram and Discord.
- **API for Journalists:** Opening up our forensic pipeline as an API for newsrooms to verify user-generated content in real-time.

---

**Machine-readable data:** [devpost.json](./devpost.json)
