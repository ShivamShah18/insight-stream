import { AnalysisWorkflow } from './workflow';

// CRITICAL: This export tells Cloudflare where the Workflow lives
export { AnalysisWorkflow };

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // API: Submit Feedback
    if (request.method === 'POST' && url.pathname === '/submit') {
      const { text } = await request.json() as any;
      const feedbackId = crypto.randomUUID();

      // 1. Save to DB as PENDING immediately (Fast Ingestion)
      await env.DB.prepare(
        "INSERT INTO feedback (id, raw_text, status, created_at) VALUES (?, ?, 'PENDING', ?)"
      ).bind(feedbackId, text, Date.now()).run();

      // 2. Trigger the Background Workflow (Async Processing)
      await env.ANALYSIS_WORKFLOW.create({ params: { feedbackId, text } });

      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // API: Get Results
    if (url.pathname === '/api/results') {
      const { results } = await env.DB.prepare("SELECT * FROM feedback ORDER BY created_at DESC").all();
      return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    }

    // Frontend: HTML Dashboard with Auto-Refresh
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>InsightStream</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body class="bg-slate-50 p-6 md:p-12 font-sans">
        <div class="max-w-4xl mx-auto">
          <header class="mb-10 flex justify-between items-center">
             <div>
                <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">InsightStream</h1>
                <p class="text-orange-600 font-medium mt-1">Cloudflare Async Feedback Pipeline</p>
             </div>
             <div class="bg-white px-4 py-2 rounded-full border shadow-sm text-xs text-gray-500">
                ⚡️ Powered by Workflows
             </div>
          </header>
          
          <div class="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 mb-8 border border-slate-100">
            <label class="block text-sm font-semibold text-gray-700 mb-2">New Feedback</label>
            <textarea id="input" class="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl h-32 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all" placeholder="e.g. 'The API latency is high in Europe...'"></textarea>
            <div class="mt-4 flex justify-end">
                <button onclick="submit()" id="btn" class="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30">
                  Analyze Feedback
                </button>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
            <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 class="font-bold text-gray-700">Live Stream</h2>
                <span class="text-xs text-green-600 font-mono bg-green-100 px-2 py-1 rounded-md animate-pulse">● Live</span>
            </div>
            <table class="w-full">
              <thead class="bg-slate-50 text-xs uppercase text-gray-400 font-medium">
                <tr>
                  <th class="text-left p-6 tracking-wider">Feedback</th>
                  <th class="text-left p-6 tracking-wider">Sentiment</th>
                  <th class="text-left p-6 tracking-wider">Category</th>
                  <th class="text-left p-6 tracking-wider">Recommended Action</th>
                  <th class="text-left p-6 tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody id="results" class="divide-y divide-slate-100"></tbody>
            </table>
          </div>
        </div>

        <script>
          async function submit() {
            const input = document.getElementById('input');
            const btn = document.getElementById('btn');
            const text = input.value;
            if(!text) return;
            
            // Optimistic UI update
            btn.innerText = "Sending...";
            btn.disabled = true;
            
            await fetch('/submit', { method: 'POST', body: JSON.stringify({ text }) });
            
            input.value = '';
            btn.innerText = "Analyze Feedback";
            btn.disabled = false;
            load(); 
          }

          async function load() {
            const res = await fetch('/api/results');
            const data = await res.json();
            const html = data.map(row => \`
              <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="p-6 text-gray-800 font-medium text-sm w-1/3">\${row.raw_text}</td>
                <td class="p-6"><span class="px-3 py-1 rounded-full text-xs font-bold border \${getSentimentStyle(row.sentiment)}">\${row.sentiment || '-'}</span></td>
                <td class="p-6 text-sm text-gray-500">\${row.category || '-'}</td>
                <td class="p-6 text-sm font-mono text-orange-600 font-semibold">⚡ \${row.action_item || 'Analyze...'}</td>
                <td class="p-6">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-50 text-blue-700'}">
                        \${row.status === 'PENDING' ? '⏳ Processing' : '✅ Ready'}
                    </span>
                </td>
              </tr>
            \`).join('');
            document.getElementById('results').innerHTML = html;
          }

          function getSentimentStyle(s) {
            if(s === 'Positive') return 'bg-green-50 text-green-700 border-green-200';
            if(s === 'Negative') return 'bg-red-50 text-red-700 border-red-200';
            return 'bg-gray-100 text-gray-600 border-gray-200';
          }

          setInterval(load, 2000);
          load();
        </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};