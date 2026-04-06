# Postcard: PantherHacks 2026 submission

**Tagline.** Democratizing the truth. Trace every post back to its source.\
**GitHub.** [github.com/postcardhq/postcard](https://github.com/postcardhq/postcard)\
**Demo.** [postcard.fartlabs.org](https://postcard.fartlabs.org)\
**Metadata.** [devpost.json](./devpost.json)

---

## Inspiration

In our "post-truth" era, information is often consumed via contextless screenshots. By the time a post goes viral, it has been cropped, captioned, and stripped of its metadata—making it nearly impossible to tell if the content is authentic or a manufactured narrative. We wanted to build a tool that acts as a digital "wayback machine" for credibility, restoring the lost link between viral content and its primary source.

## What it does

**Postcard** is a digital forensics pipeline designed to rebuild trust in online media. It takes a social media URL (or a screenshot) and traces it back to its original source. The core of the project is the **Postcard Score (0–100%)**, a credibility metric calculated by auditing how much the content has drifted from the ground truth.

### Key features

- **Forensic traceability.** Automatically identifies the primary source of a claim across X, Reddit, and major news outlets.
- **Drift analysis.** Audits content for forensic consistency, checking for temporal alignment and attribution errors.
- **Screenshot-to-URL resolution.** Part of our original vision, this feature allows users to upload a screenshot to find its live, interactive counterpart for deep verification.
- **Subscore breakdown.** Users don't just get a number; they see a breakdown of source reliability, temporal verification, and cross-platform corroboration.

## How we built it

We developed a 4-stage forensic pipeline focused on deep audit log generation:

- **Multimodal ingest.** We utilized **Jina Reader** to ingest live content and establish a "ground truth" version of the post.
- **Forensic audit.** Using **Playwright**, we performed direct site checks to verify the origin and ensure the timestamp aligns with the reported narrative.
- **Corroboration engine.** We implemented a deep search across trusted domains to verify claims and find mentions of the content elsewhere to determine its "drift."
- **Verification platform.** Built with **Next.js** and **Tailwind CSS**, providing a clean, terminal-inspired interface for quick, simple forensic verification.

## Pitch and demonstration script

**Objective.** Deliver a clear, technically impressive demonstration of the Postcard forensic pipeline for PantherHacks 2026.

### Pitch outline (3:00)

- **0:00 - 0:10.** Intro: Team and mission.
- **0:10 - 0:35.** Problem: Contextless screenshots and misinformation.
- **0:35 - 1:00.** Solution: Open-source verification API.
- **1:00 - 1:30.** Demo video: Product walkthrough.
- **1:30 - 2:20.** Platform demo: App walkthrough and Postcard Score.
- **2:20 - 2:50.** Extension demo: In-feed verification.
- **2:50 - 3:00.** Conclusion: Q&A and final wrap.

### Script

1.  **Identify the problem.** "Every day, thousands of misleading social media screenshots circulate the web. They lack context, original links, and accountability. How do we know if a viral 'receipt' is actually real or just edited? Meet Postcard. We don't just fact-check; we **Trace the Truth**."
2.  **Our solution.** "Postcard is a digital forensics pipeline designed to trace any social media post back to its source. We utilize the **'Wisdom of the Crowd'** to triangulate a post's definitive source from even a low-quality screenshot. When you drop a URL into our system, we don't just look at the text—we audit the underlying metadata."
3.  **Postcard score.** "All this data is distilled into a **Postcard Score**. It’s a technical audit trail measuring content drift. We check engagement metrics, absolute timestamps, and cross-platform consistency to give a clear verdict on the post's integrity."
4.  **Closing statement.** "Postcard brings transparency back to social media by **Tracing the Truth** directly to the source. We're democratizing honesty through technical verification. Thank you."

## What's next for Postcard

- **Browser extension.** Bringing Postcard directly into the feed, allowing users to right-click any post to see its score instantly.
- **Expanded platform support.** Increasing our corroboration engine to include specialized platforms like Telegram and Discord.
- **API for journalists.** Opening up our forensic pipeline as an API for newsrooms to verify user-generated content in real-time.

---

### Demos

- **YouTube demo of the browser extension.** [https://youtu.be/TXQTkkFSJhU](https://youtu.be/TXQTkkFSJhU)
- **YouTube demo of the app.** [https://youtu.be/3AQTUkImhM8](https://youtu.be/3AQTUkImhM8)
