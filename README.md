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
npm install
npx wrangler d1 execute insight-db --local --file=schema.sql
npx wrangler dev
```