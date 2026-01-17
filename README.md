# InsightStream: Event-Driven Feedback Analysis

**Live Demo:** [https://insight-stream.shah-shiv1620.workers.dev](https://insight-stream.shah-shiv1620.workers.dev)

> **InsightStream** is an **Event-Driven Intelligence Pipeline** that ingests raw user feedback, instantly acknowledges receipt (<100ms latency), and asynchronously processes it to extract strategic actions.

## 🚀 The Challenge
Product feedback is noisy. InsightStream is a unified feedback aggregation system that acts as an intelligent triage layer. It separates **Signal from Noise**, identifying critical outages immediately while also highlighting **Success Stories** to boost team morale.

## 🏗 Architecture (Mission Aligned)
Built on the **Cloudflare Developer Platform**, this architecture prioritizes **User-Perceived Latency** and **System Resilience**:

1.  **Ingestion (Cloudflare Workers):** Acts as a lightweight API Gateway. It accepts requests, writes a "Pending" state to D1, and returns `200 OK` immediately.
2.  **Orchestration (Cloudflare Workflows):** Decouples heavy AI compute from the user-facing API. Manages retries and state, ensuring zero data loss during traffic spikes.
3.  **Intelligence (Workers AI):** Utilizes `@cf/meta/llama-3-8b-instruct` with a custom "Lead PM" system prompt for semantic analysis.
4.  **Priority Engine:** Implements a Volume-Adjusted Scoring algorithm that mathematically boosts the impact score of issues based on the frequency of similar reports.
5.  **Persistence (Cloudflare D1):** Serverless SQLite database for structured state management.

## 🚀 Features
- **Async Event Pipeline:** Non-blocking ingestion ensures the UI never hangs.
- **Volume-Based Prioritization:** Issues mentioned by multiple users get a `+3` score boost per occurrence, bubbling frequent bugs to the top.
- **Emotional Intelligence Triage:** Automatically detects **"Praise"** (Green Status) to boost team morale, while flagging **"Outages"** (Red Status) for immediate action.
- **Real-Time Dashboard:** Auto-polling interface that groups feedback by strategic category.

## 🎯 Priority Scoring Logic
The AI assigns a base score, which is then adjusted by the Volume Engine:

- **90-100 (Red):** Critical Outages (Site down, payments failing, security leaks)
- **60-89 (Orange):** Major Bugs (Feature broken, login failed, error messages)
- **30-59 (Blue):** Feature Requests (Dark mode, enhancements)
- **10-29 (Gray):** Cosmetic/Trivial (Typos, colors, copyright dates)
- **0-9 (Green):** Praise & Positive Sentiment (Success stories, "Love this")

**Volume boost:** Issues with multiple similar reports get **+3 points per duplicate**, ensuring popular problems surface to the top naturally.

## 🛠 Tech Stack
- **Cloudflare Workflows** (Async Orchestration)
- **Cloudflare D1** (Database)
- **Workers AI** (Llama 3)
- **TypeScript** & **Tailwind CSS**

## 🏃‍♂️ Local Development
```bash
npm install
npx wrangler d1 execute insight-db --local --file=schema.sql
npx wrangler dev
```

## Deploy
```
npx wrangler deploy
npx wrangler d1 execute insight-db --remote --file=schema.sql
```

## 🔗 Integration Vision
This prototype demonstrates the core triage engine. In production, it would integrate with:
- Discord - Webhook listener for community feedback
- GitHub - Issue tracker integration
- Support Systems - Ticket import APIs
- Email - Inbox parsing for feedback emails
All feedback flows into the same prioritization engine, giving PMs a unified view of what matters most.

## 📝 Vibe Coding Context
This project was architected and built using Cursor (Claude 3.5 Sonnet) to accelerate the "Build" phase.

Platform: Cursor (AI-First Editor)

Methodology: I utilized "Composer" to focus on System Design rather than syntax. My prompts focused on defining the schema and the data flow (e.g., "Refactor this synchronous API into an asynchronous Workflow pattern").

Outcome: This allowed me to spend 80% of my time on architectural decisions (choosing Workflows vs. Queues) and only 20% on writing boilerplate code.