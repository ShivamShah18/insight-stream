import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
// EXPORT IS MANDATORY
export { AnalysisWorkflow } from './workflow';

export interface Env {
	DB: D1Database;
	ANALYSIS_WORKFLOW: Workflow;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// 1. Submit Endpoint
		if (request.method === "POST" && url.pathname === "/submit") {
			try {
				const { text } = await request.json() as { text: string };
				const id = crypto.randomUUID();

				// Write "Pending" state immediately
				await env.DB.prepare(
					"INSERT INTO feedback (id, raw_text, status, impact_score, created_at) VALUES (?, ?, 'PENDING', 0, ?)"
				).bind(id, text, Date.now()).run();

				// Trigger Async Workflow
				await env.ANALYSIS_WORKFLOW.create({
					params: { feedbackId: id, text }
				});

				return new Response(JSON.stringify({ success: true }), { 
					headers: { "Content-Type": "application/json" } 
				});
			} catch (err: any) {
				return new Response(JSON.stringify({ error: err.message }), { status: 500 });
			}
		}

		// 2. Data Polling Endpoint
		if (url.pathname === "/api/data") {
			try {
				const { results } = await env.DB.prepare(
					"SELECT * FROM feedback ORDER BY impact_score DESC, created_at DESC"
				).all();
				return new Response(JSON.stringify(results), {
					headers: { "Content-Type": "application/json" }
				});
			} catch (e) {
				return new Response("[]", { headers: { "Content-Type": "application/json" }});
			}
		}

		// 3. Serve the UI
		return new Response(html, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	},
} as ExportedHandler<Env>;

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>InsightStream | Cloudflare</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F9FAFB; }
        .cf-orange { color: #F6821F; }
        .bg-cf-orange { background-color: #F6821F; }
    </style>
</head>
<body class="text-slate-800">

    <nav class="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-cf-orange rounded flex items-center justify-center">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                    <h1 class="text-lg font-bold tracking-tight text-slate-900">InsightStream</h1>
                    <p class="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Internal Feedback Intelligence</p>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <span class="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Systems Operational
                </span>
                <div class="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">PM</div>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div class="flex justify-between items-end mb-8">
            <div>
                <h2 class="text-2xl font-bold text-slate-900">Feedback Triage</h2>
                <p class="text-slate-500 mt-1">Real-time prioritization based on AI sentiment & volume clustering.</p>
            </div>
            
            <div class="flex gap-4">
                <div class="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <p class="text-xs text-slate-400 font-semibold uppercase">Total Issues</p>
                    <p class="text-lg font-bold text-slate-800" id="totalCount">-</p>
                </div>
                <div class="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <p class="text-xs text-slate-400 font-semibold uppercase">Avg Impact</p>
                    <p class="text-lg font-bold text-cf-orange" id="avgImpact">-</p>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-8">
            <div class="flex">
                <input type="text" id="inputText" 
                    class="flex-1 px-6 py-4 text-lg outline-none rounded-l-xl placeholder-slate-400" 
                    placeholder="Paste customer feedback (e.g. 'Discord users reporting 500 errors on login')..." 
                    onkeydown="if(event.key === 'Enter') submitFeedback()">
                <button onclick="submitFeedback()" id="submitBtn" 
                    class="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-4 rounded-r-lg transition-all flex items-center gap-2">
                    <span>Analyze</span>
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table class="min-w-full divide-y divide-slate-100">
                <thead class="bg-slate-50">
                    <tr>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw Feedback</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">AI Priority Score</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommended Action</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">State</th>
                    </tr>
                </thead>
                <tbody id="tableBody" class="divide-y divide-slate-100 bg-white">
                    </tbody>
            </table>
            
            <div id="emptyState" class="hidden p-12 text-center">
                <div class="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                    <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <h3 class="text-sm font-semibold text-slate-900">No feedback yet</h3>
                <p class="text-sm text-slate-500 mt-1">Submit feedback above to start the triage engine.</p>
            </div>
        </div>

    </main>

    <script>
        // Color Logic
        function getImpactColor(score) {
            if (score >= 80) return 'bg-red-500';
            if (score >= 50) return 'bg-orange-400';
            return 'bg-blue-400';
        }

        function getWidth(score) {
            return Math.max(5, Math.min(100, score)) + '%';
        }

        // Submit Logic
        async function submitFeedback() {
            const input = document.getElementById('inputText');
            const btn = document.getElementById('submitBtn');
            const text = input.value.trim();

            if(!text) return;

            // Optimistic UI: Disable button
            btn.innerHTML = '<span class="animate-spin">⟳</span> Processing';
            btn.disabled = true;
            btn.classList.add('opacity-75');

            try {
                await fetch('/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                
                input.value = '';
                pollData(); // Force immediate update
            } catch (err) {
                alert('Error submitting feedback');
            } finally {
                btn.innerHTML = '<span>Analyze</span><svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>';
                btn.disabled = false;
                btn.classList.remove('opacity-75');
                input.focus();
            }
        }

        // Polling Logic
        async function pollData() {
            try {
                const res = await fetch('/api/data');
                const data = await res.json();
                const tbody = document.getElementById('tableBody');
                const emptyState = document.getElementById('emptyState');

                // Update Stats
                document.getElementById('totalCount').innerText = data.length;
                const avg = data.length ? Math.round(data.reduce((a, b) => a + (b.impact_score || 0), 0) / data.length) : 0;
                document.getElementById('avgImpact').innerText = avg;

                if (data.length === 0) {
                    tbody.innerHTML = '';
                    emptyState.classList.remove('hidden');
                    return;
                }

                emptyState.classList.add('hidden');
                
                tbody.innerHTML = data.map(row => \`
                    <tr class="hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0">
                        <td class="px-6 py-4 align-top">
                            <p class="text-sm font-medium text-slate-900 line-clamp-2">\${row.raw_text}</p>
                            <p class="text-xs text-slate-400 mt-1">\${new Date(row.created_at || Date.now()).toLocaleTimeString()}</p>
                        </td>
                        <td class="px-6 py-4 align-top">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                \${row.category || 'General'}
                            </span>
                        </td>
                        <td class="px-6 py-4 align-middle">
                            <div class="flex flex-col gap-1 w-full max-w-[180px]">
                                <div class="flex justify-between items-end">
                                    <span class="text-xs font-bold text-slate-700">\${row.impact_score || 0}</span>
                                    \${(row.impact_score > 70) ? '<span class="text-[10px] text-red-600 font-bold uppercase tracking-wider">Critical</span>' : ''}
                                </div>
                                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full \${getImpactColor(row.impact_score || 0)} transition-all duration-500" style="width: \${getWidth(row.impact_score || 0)}"></div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 align-top">
                             <div class="flex items-center gap-2">
                                <span class="text-orange-500">⚡</span>
                                <span class="text-sm font-mono font-semibold text-slate-700">\${row.action_item || 'Analyzing...'}</span>
                             </div>
                        </td>
                        <td class="px-6 py-4 align-top text-right">
                            \${row.status === 'PENDING' 
                                ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100"><span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Processing</span>' 
                                : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 shadow-sm">Done</span>'
                            }
                        </td>
                    </tr>
                \`).join('');

            } catch(e) { console.error("Poll failed", e); }
        }

        // Start Loop
        setInterval(pollData, 2000);
        pollData(); // Initial load
    </script>
</body>
</html>
`;