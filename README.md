# Postcard: Digital Pathologist

**Postcard** is an AI-powered digital forensics system designed to verify the authenticity of screenshots and resolve their origin URLs. It treats a screenshot as a "Postcard" from a specific web location and uses an agentic loop to verify its "Postmark" (origin, timestamp, and UI authenticity).

## High-Level Architecture

The system follows a multi-stage **Extract → Triangulate → Verify** pipeline.

### Vision & OCR Parser
- **Engine:** Gemini 2.0 Flash via Vercel AI SDK v6.
- **Output:** Interleaved Markdown containing raw text and a structured "Postmark" (usernames, timestamps, engagement metrics).
- **Tooling:** `sharp` for image preprocessing.

### Navigator Agent (Triangulation)
- **Engine:** Gemini 2.0 Flash with **Google Search Grounding**.
- **Role:** Directly triangulates the exact source URL using live Google Search results.
- **Benefits:** High-precision URL resolution without complex manual search logic.

### Forensic Verifier (Postmark Audit)
- **Engine:** Playwright and Gemini.
- **Role:** Scrapes the live web at the resolved URL and compares it against the OCR data.
- **Anomaly Score ($S$):** Calculated based on Origin, Temporal, and Visual alignment.

## Technology Stack

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS.
- **AI SDK:** Vercel AI SDK v6 (`ai`, `@ai-sdk/google`).
- **Models:** Gemini 2.0 Flash.
- **Browser Automation:** Playwright.
- **Image Processing:** Sharp.
- **Validation:** Zod.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Gemini API Key

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Navigate to `/dashboard`.
2. Upload a screenshot (e.g., a tweet, a Reddit post, or a news article).
3. Postcard will:
   - Extract text and metadata.
   - Ground the content in live Google Search results.
   - Verify the content against the source URL.
   - Provide a comprehensive "Travel Log" and Anomaly Score.
