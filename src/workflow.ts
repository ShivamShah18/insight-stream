import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = {
  AI: any;
  DB: D1Database;
};

type Params = {
  feedbackId: string;
  text: string;
};

export class AnalysisWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { feedbackId, text } = event.payload;

    // Step 1: AI Analysis (STRICT MODE)
    const analysis = await step.do('ai-analysis', async () => {
        const messages = [
            { 
            role: 'system', 
            content: `You are a strict Technical Product Manager. Analyze this feedback and assign a "base_score" (0-100) based on BUSINESS RISK.

            SCORING RULES:
            - 90-100: CRITICAL OUTAGE (Site down, Payments failing, Security leak).
            - 60-89: MAJOR BUG (Feature broken, Login failed, Error messages).
            - 30-59: FEATURE REQUEST (Dark mode, New buttons, Enhancements).
            - 0-29: COSMETIC / TRIVIAL (Typos, Colors, Copyright dates).

            Return valid JSON only:
            {
              "sentiment": "Positive" | "Neutral" | "Negative",
              "category": "Bug" | "Feature Request" | "Docs" | "Outage",
              "urgency": "High" | "Medium" | "Low",
              "base_score": <number based on rules above>,
              "action_item": "<2-5 word command>"
            }`
            },
            { role: 'user', content: text }
        ];
      
      try {
        const response: any = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', { messages });
        
        const raw = response.response || "{}";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        return { sentiment: "Neutral", category: "General", urgency: "Low", base_score: 10, action_item: "Manual Review" };
      }
    });

    // Step 2: Volume Logic (Dampened)
    const finalScore = await step.do('calculate-volume', async () => {
        const result = await this.env.DB.prepare(
            "SELECT COUNT(*) as count FROM feedback WHERE category = ?"
        ).bind(analysis.category || "General").first();

        const count = (result as any).count || 0;
        const aiScore = analysis.base_score || 0;
        
        // Multiplier reduced to 3 (prevent runaway scores)
        // Feature Request (40) + 10 votes (30) = 70. Still less than Outage (90).
        return Math.min(100, aiScore + (count * 3));
    });

    // Step 3: Save
    await step.do('save-to-db', async () => {
        await this.env.DB.prepare(
            `UPDATE feedback 
             SET sentiment = ?, category = ?, urgency = ?, action_item = ?, impact_score = ?, status = 'READY' 
             WHERE id = ?`
          ).bind(
            analysis.sentiment, 
            analysis.category, 
            analysis.urgency, 
            analysis.action_item, 
            finalScore,
            feedbackId
          ).run();
    });
  }
}
