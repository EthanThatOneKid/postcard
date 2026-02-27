# Postcard: The Digital Pathologist

**Postcard** is an AI-powered digital forensics system designed to resolve URLs from screenshots and detect anomalies (fabrications) in the content. It functions as a "Digital Pathologist," treating every screenshot as a "Postcard" and verifying its "Postmark" against the live web.

## 🚀 Overview

The system followed a multi-stage **Extract → Triangulate → Verify** pipeline:
1.  **Vision & OCR Parser:** Extracts interleaved Markdown and "Postmark" metadata (usernames, timestamps, engagement).
2.  **Triangulation Agent (The Navigator):** Uses LangGraph and Toolhouse to generate search queries and resolve the source URL.
3.  **Forensic Verifier (Postmark Audit):** Scrapes live metadata and performs a three-way comparison to calculate an Anomaly Score.

## 🏗️ Architecture

- **Component A: Vision & OCR Parser**
  - **Engine:** Gemini 2.0 Flash.
  - **Logic:** Identifies UI anchors, font weights, and platform identities.
- **Component B: The Navigator Agent**
  - **Framework:** LangGraph.
  - **Tools:** Toolhouse / Tavily for real-time web and historical cache access.
- **Component C: The Postmark Audit**
  - **Engine:** Playwright.
  - **Scoring:** $S = (w_1 \cdot O) + (w_2 \cdot T) + (w_3 \cdot V)$ (Origin, Temporal, Visual).

## 🛠️ Technology Stack

- **Frontend:** Next.js (App Router, Tailwind CSS).
- **Agents:** LangGraph (@langchain/langgraph).
- **Search:** Toolhouse (@toolhouseai/sdk).
- **OCR:** Google Generative AI (@google/generative-ai).
- **Browser Automation:** Playwright.

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- API Keys for Mistral, Gemini, Toolhouse, OpenAI, and Tavily/Serper.

### Installation

```bash
# Clone the repository
git clone https://github.com/EthanThatOneKid/postcard.git
cd postcard

# Install dependencies
npm install
```

### Configuration

Create a `.env` file in the root directory (refer to `.env.example`):

```env
MISTRAL_API_KEY=your_key
GEMINI_API_KEY=your_key
TOOLHOUSE_API_KEY=your_key
OPENAI_API_KEY=your_key
# ... other keys
```

### Running the App

```bash
npm run dev
```

Visit `http://localhost:3000/dashboard` to start analyzing postcards.

## 📄 License

MIT
