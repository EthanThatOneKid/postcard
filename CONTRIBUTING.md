# Postcard contributor notes

This document provides technical context and setup instructions for developers and contributors to the **Postcard** project.

## Quick start

To set up the development environment, perform the following steps:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/EthanThatOneKid/postcard.git
    cd postcard
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Verify the environment:**

    ```bash
    npm run check  # Run linting and type-checks
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Technical stack

Postcard utilizes a modern, type-safe stack designed for forensic performance and developer velocity.

| Layer             | Choice                   | Why                                                              |
| ----------------- | ------------------------ | ---------------------------------------------------------------- |
| **Frontend**      | Next.js 16               | Provides a responsive dashboard and high-performance API routes. |
| **AI / Vision**   | Google Gemini            | Enables native multimodal vision and search grounding.           |
| **Orchestration** | Vercel AI SDK v6         | Supports robust tool calling and typed stream iteration.         |
| **Storage**       | Drizzle + libSQL (Turso) | Ensures type-safe libSQL persistence for forensic logs.          |
| **Automation**    | Playwright / sharp       | Handles headless scraping and image preprocessing.               |

## AI developer experience

The Postcard pipeline relies heavily on the **[Vercel AI SDK v6](https://sdk.vercel.ai/)** for complex agentic orchestration.

### AI SDK Skills

The project uses **AI SDK Skills** to enforce industry-standard best practices. These localized intelligence configurations guide agentic assistants to follow idiomatic patterns for:

- `streamText` iteration
- `toolCall` payload handling
- Multi-step search grounding

This approach ensures 100% type-safety throughout the forensic pipeline.

## Style guide

To maintain a professional and consistent technical narrative, all documentation must follow these standards:

### Sentence case titles

Use sentence case for all headings and titles (e.g., "What it does" instead of "What It Does"). Only capitalize proper nouns like "Postcard", "Next.js", or "Vercel".

### Active voice

Prioritize active voice in all technical descriptions. Identify the actor and the action clearly.

- **Good:** "The preprocessor enhances the image."
- **Bad:** "The image is enhanced by the preprocessor."
