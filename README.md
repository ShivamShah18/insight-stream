# InsightStream: AI-Powered Feedback Triage System

**Live Demo:** [Your deployed worker URL]  
**GitHub Repository:** [Your repo URL]

> Automatically aggregate, analyze, and prioritize product feedback from multiple sources using AI-powered triage.

## 🎯 Problem

Product managers receive feedback from multiple sources daily:
- Customer Support Tickets
- Discord communities
- GitHub issues
- Email
- X/Twitter
- Community forums

This feedback is **noisy and scattered**, making it difficult to:
- Extract themes and patterns
- Determine urgency and priority
- Identify which issues affect the most users
- Take strategic action

## 💡 Solution

InsightStream is a unified feedback aggregation system that:

1. **Aggregates** feedback from multiple APIs (Discord, GitHub, Support tickets, etc.)
2. **Analyzes** each piece of feedback using AI to extract:
   - Sentiment (Positive/Neutral/Negative)
   - Category (Bug/Feature Request/Docs/Outage)
   - Urgency (High/Medium/Low)
   - Strategic action items
3. **Prioritizes** based on:
   - **Business risk** (outages > bugs > features > cosmetic)
   - **Volume clustering** (issues mentioned by multiple users get higher priority)
   - **Sentiment** (negative feedback prioritized over positive)

## 🏗 Architecture

Built on **Cloudflare's Developer Platform**:

- **Cloudflare Workers** - Edge computing for instant API responses
- **D1 Database** - Serverless SQLite for storing feedback
- **Workers AI** - On-edge AI inference (Llama-3-8b-instruct) for analysis
- **Workflows** - Async orchestration for processing pipeline

### How It Works

1. Feedback is ingested from various sources (Discord webhooks, GitHub issues, support tickets, etc.)
2. Each feedback entry is immediately stored with "PENDING" status
3. Async workflow analyzes the feedback using AI
4. System calculates priority score based on:
   - AI-determined business risk (0-100)
   - Volume of similar feedback (duplicate issues get boosted)
5. Results are displayed in a real-time dashboard, sorted by priority

## 🚀 Features

- **Multi-source aggregation** - Connect to Discord, GitHub, Support systems, etc.
- **AI-powered analysis** - Automatic sentiment, category, and urgency detection
- **Volume-based prioritization** - Issues mentioned by multiple users rank higher
- **Real-time dashboard** - Auto-refreshing view of all feedback sorted by impact
- **Strategic action items** - Each feedback gets a recommended next step

## 📦 Setup

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Local Development

```bash
npm install
npx wrangler d1 execute insight-db --local --file=schema.sql
npm run dev
```

### Deploy

```bash
npx wrangler deploy
npx wrangler d1 execute insight-db --remote --file=schema.sql
```

## 🎯 Priority Scoring

Feedback is scored 0-100 based on:

- **90-100:** Critical Outages (site down, payments failing, security leaks)
- **60-89:** Major Bugs (feature broken, login failed, error messages)
- **30-59:** Feature Requests (dark mode, new buttons, enhancements)
- **0-29:** Cosmetic/Trivial (typos, colors, copyright dates)

**Volume boost:** Issues with multiple similar reports get +3 points per duplicate, ensuring popular problems surface to the top.

## 🔗 Integration Vision

This prototype demonstrates the core triage engine. In production, it would integrate with:

- **Discord** - Webhook listener for community feedback
- **GitHub** - Issue tracker integration
- **Support Systems** - Ticket import APIs
- **Email** - Inbox parsing for feedback emails
- **Twitter/X** - Social media monitoring
- **Community Forums** - RSS/API feeds

All feedback flows into the same prioritization engine, giving PMs a unified view of what matters most.

## 📄 License

MIT

---

**Built for Cloudflare Product Manager Intern Assignment (Summer 2026)**
