# InsightStream: Event-Driven Feedback Analysis

**Live Demo:** [https://insight-stream.shah-shiv1620.workers.dev](https://insight-stream.shah-shiv1620.workers.dev)

## 🚀 The Challenge
Product feedback is noisy. InsightStream is an **Event-Driven Intelligence Pipeline** that ingests raw user feedback, instantly acknowledges receipt (<100ms latency), and asynchronously processes it to extract strategic actions.

## 🏗 Architecture (Mission Aligned)
Built on the **Cloudflare Developer Platform**, this architecture prioritizes user-perceived latency and reliability:

1.  **Ingestion (Workers):** A lightweight API Gateway that writes to D1 and returns `200 OK` immediately.
2.  **Orchestration (Workflows):** Decouples AI inference from the user request, ensuring the API never hangs during traffic spikes.
3.  **Intelligence (Workers AI):** Uses `Llama-3-8b-instruct` with a custom "Lead PM" system prompt to generate decisive Action Items.
4.  **Storage (D1):** Serverless SQLite for structured state management.

## 🛠 Tech Stack
- **Cloudflare Workflows** (Async Orchestration)
- **Cloudflare D1** (Database)
- **Workers AI** (Llama 3)
- **TypeScript** & **Tailwind CSS**

## 🏃‍♂️ Local Development
```bash
npm install # Installing Dependencies
npx wrangler d1 execute insight-db --local --file=schema.sql # Initializing Database
npx wrangler dev # Running Locally
```

## 📝 Vibe Coding Context
- This project was architected and built using Cursor (Claude 3.5 Sonnet) to accelerate the "Build" phase.
- **Platform: Cursor (AI-First Editor)**
- Methodology: I utilized "Composer" to focus on System Design rather than syntax. My prompts focused on defining the schema and the data flow (e.g., "Refactor this synchronous API into an asynchronous Workflow pattern").
- Outcome: This allowed me to spend 80% of my time on architectural decisions (choosing Workflows vs. Queues) and only 20% on writing boilerplate code.
