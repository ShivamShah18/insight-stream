import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  AI: Ai;
  DB: D1Database;
};

type Params = {
  feedbackId: string;
  text: string;
};

export class AnalysisWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { feedbackId, text } = event.payload;

    // Step 1: Analyze with AI
    const analysis = await step.do('analyze-feedback', async () => {
      const messages = [
        { 
          role: 'system', 
          content: `You are a Senior Product Manager at Cloudflare. Analyze this user feedback.
          
          Return a valid JSON object with these exact keys:
          - sentiment: "Positive", "Neutral", or "Negative"
          - category: "Bug", "Feature Request", "Documentation", or "Pricing"
          - urgency: "High", "Medium", or "Low" (High = security issues, outages, or blockers)
          - action_item: A short, 3-5 word strategic next step (e.g., "Open JIRA Ticket", "Update Docs", "Notify Sales").`
        },
        { role: 'user', content: text }
      ];
      
      try {
        const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
            messages,
            max_tokens: 150
        });
        
        // Robust JSON parsing (handles if AI adds extra text)
        const raw = (response as any).response || "{}";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : "{}";
        return JSON.parse(jsonStr);
      } catch (e) {
        // Fallback if AI fails (e.g. offline)
        return { sentiment: "Neutral", category: "General", urgency: "Low", action_item: "Review Manually" };
      }
    });

    // Step 2: Save to Database
    await step.do('save-to-db', async () => {
      await this.env.DB.prepare(
        `UPDATE feedback SET sentiment = ?, category = ?, urgency = ?, action_item = ?, status = 'COMPLETED' WHERE id = ?`
      ).bind(analysis.sentiment, analysis.category, analysis.urgency, analysis.action_item, feedbackId).run();
    });
  }
}