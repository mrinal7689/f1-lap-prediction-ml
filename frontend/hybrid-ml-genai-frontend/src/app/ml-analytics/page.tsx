"use client";

import React, { useState } from "react";

export default function MLAnalyticsPage() {
  const [year, setYear] = useState("2024");
  const [circuit, setCircuit] = useState("Monaco");
  const [session, setSession] = useState("R");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  const runML = async () => {
    setOutput("");
    setLoading(true);

    try {
      // 1) Start run
      const runRes = await fetch("http://localhost:8000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ml",
          params: { year: Number(year), circuit, session },
        }),
      });

      if (!runRes.ok) {
        const txt = await runRes.text();
        setOutput(`POST /api/run failed: ${runRes.status} ${txt}`);
        setLoading(false);
        return;
      }

      const { runId } = await runRes.json();
      setLastRunId(runId);
      console.log("Started runId:", runId);

      // 2) Open SSE stream
      const es = new EventSource(`http://localhost:8000/api/run/${runId}/stream`);

      // Listen for custom 'token' events from backend
      es.addEventListener("token", (ev: any) => {
        // ev.data contains the token/text chunk
        console.log("token:", ev.data);
        setOutput((p) => p + (p ? "\n" : "") + ev.data);
      });

      // 'done' means finished with final payload
      es.addEventListener("done", (ev: any) => {
        console.log("done event:", ev.data);
        setOutput((p) => p + (p ? "\n\n" : "") + "=== DONE ===\n" + ev.data);
        setLoading(false);
        es.close();
      });

      // fallback: catch normal messages if backend sends them
      es.onmessage = (e) => {
        console.log("message:", e.data);
        setOutput((p) => p + (p ? "\n" : "") + e.data);
      };

      es.onerror = (err) => {
        console.error("EventSource error", err);
        setOutput((p) => p + "\n\nEventSource error (check backend logs).");
        setLoading(false);
        es.close();
      };
    } catch (err: any) {
      setOutput(`Exception: ${String(err)}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-white">FastF1 ML Analytics</h1>

      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 shadow-lg space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
            className="p-3 rounded bg-gray-950 border border-gray-800 text-white"
          />
          <input
            value={circuit}
            onChange={(e) => setCircuit(e.target.value)}
            placeholder="Circuit (e.g., Monaco)"
            className="p-3 rounded bg-gray-950 border border-gray-800 text-white"
          />
          <input
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="Session (R/Q/FP1)"
            className="p-3 rounded bg-gray-950 border border-gray-800 text-white"
          />
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={runML}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Run Analysis
          </button>

          {loading && <span className="text-yellow-400">Processing…</span>}
          {lastRunId && <span className="text-sm text-gray-400 ml-2">runId: {lastRunId}</span>}
        </div>

        <textarea
          className="w-full h-80 mt-4 bg-gray-950 border border-gray-800 p-4 text-green-400 rounded-lg font-mono text-sm"
          readOnly
          value={output}
        />
      </div>
    </div>
  );
}
