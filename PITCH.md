# Postcard pitch script (2 mins)

**Objective**: Deliver a clear, technically impressive demonstration of the Postcard forensic pipeline for PantherHacks 2026.

### 0:00 - 0:20: the problem (the "fake news" crisis)

- **Visual**: Dashboard intro
- **Script**: "Every day, thousands of misleading social media screenshots circulate the web. They lack context, original URLs, and accountability. This is the 'Digital Fog'. How do we know if a viral 'receipt' is actually real, or just a sophisticated fabric? Meet **Postcard**."

### 0:20 - 0:45: the solution (the forensic postcard)

- **Visual**: Show the **DropZone** with the airmail animation.
- **Script**: "Postcard is a digital forensics pipeline designed to trace any social media post back to its primary source. When you drop a URL into our system, we don't just look at the pixels—we analyze the digital DNA. Our ingest engine uses the Jina Reader API to extract live metadata—handles, timestamps, and engagement—to begin the audit."

### 0:45 - 1:20: technical deep-dive (the pipeline)

- **Visual**: Tech stack slide
- **Script**: "We use a multi-stage forensic pipeline powered by the Vercel AI SDK and Google Gemini.
  1. First, we ingest the live post content to establish ground truth.
  2. Next, we use **Playwright** to perform a live site audit.
  3. Finally, our **Corroboration Agent** performs deep dorking across trusted domains like X, Reddit, and news archives to verify the claim."

### 1:20 - 1:45: the postcard score

- **Visual**: Show the **Travel Log** dashboard with scores (e.g., 85/100).
- **Script**: "All this data is distilled into the **postcard score**. It’s not just a number; it’s a forensic audit trail. We check engagement metrics, account verification, and cross-platform consistency to give a clear verdict on whether a post holds its stamp of truth."

### 1:45 - 2:00: closing (the future of trust)

- **Visual**: Show the final "dispatch" animation and the Devpost track logo (Cybersecurity).
- **Script**: "In an era of deepfakes and context-collapse, Postcard brings transparency back to social media. We're not just tracing content; we're rebuilding trust, one postcard at a time. Thank you."
