# Postcard pitch script (2 mins)

Objective: Deliver a clear, technically impressive demonstration of the Postcard forensic pipeline for PantherHacks 2026.

### Problem

- Visual: Dashboard intro
- Script: "Every day, thousands of misleading social media screenshots circulate the web. They lack context, original links, and accountability. How do we know if a viral 'receipt' is actually real or just edited? Meet Postcard."

### Solution

- Visual: Show the DropZone with the airmail animation.
- Script: "Postcard is a digital forensics pipeline designed to trace any social media post back to its original source. When you drop a URL into our system, we don't just look at the text—we analyze the underlying metadata. Our ingest engine extracts live details—handles, timestamps, and engagement—to start the audit."

### Tech stack

- Visual: Tech stack slide
- Script: "We use a multi-stage forensic pipeline powered by the Vercel AI SDK and Google Gemini.
  1. First, we ingest the live post content to establish ground truth.
  2. Next, we use Playwright to perform a site audit.
  3. Finally, our Corroboration Agent performs search across trusted domains like X, Reddit, and news archives to verify the claim."

### Score

- Visual: Show the Travel Log dashboard with scores (e.g., 85/100).
- Script: "All this data is distilled into the postcard score. It’s a technical audit trail. We check engagement metrics, account verification, and cross-platform consistency to give a clear verdict on whether a post matches the original source."

### Closing

- Visual: Show the final "dispatch" animation and the Devpost track logo (Cybersecurity).
- Script: "Postcard brings transparency back to social media by tracing content back to its source. We're rebuilding trust through technical verification. Thank you."
