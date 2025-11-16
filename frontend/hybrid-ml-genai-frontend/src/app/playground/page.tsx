"use client";

import { useState } from "react";
import { Send, Sparkles, Brain, Cpu } from "lucide-react";

const API_BASE = "http://localhost:8000"; // backend URL

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [model, setModel] = useState("hybrid");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setOutput("");

    try {
      // 1️⃣ Start a new run
      const resp = await fetch(`${API_BASE}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: "demo",
          mode: model, // 'ml' | 'genai' | 'hybrid'
          input: prompt,
          params: {},
        }),
      });

      const data = await resp.json();
      const runId = data.runId;

      // 2️⃣ Open SSE stream
      const es = new EventSource(`${API_BASE}/api/run/${runId}/stream`);

      es.onmessage = (e) => {
        setOutput((prev) => prev + e.data);
      };

      es.addEventListener("token", (e: MessageEvent) => {
        setOutput((prev) => prev + (e.data || ""));
      });

      es.addEventListener("ml", (e: MessageEvent) => {
        setOutput((prev) => prev + `\n\n[ML] ${e.data}\n\n`);
      });

      es.addEventListener("done", (e: MessageEvent) => {
        setOutput((prev) => prev + `\n\n✅ Done\n`);
        setLoading(false);
        es.close();
      });

      es.onerror = (err) => {
        console.error("SSE error", err);
        setOutput((prev) => prev + "\n\n⚠️ Stream error.\n");
        setLoading(false);
        es.close();
      };
    } catch (err) {
      console.error(err);
      setOutput("❌ Error starting run");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title + Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Playground</h1>
        <div className="flex items-center gap-3 text-sm">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white px-3 py-1.5 rounded-lg outline-none focus:border-gray-500"
          >
            <option value="ml">ML Model</option>
            <option value="genai">GenAI Model</option>
            <option value="hybrid">Hybrid (ML + GenAI)</option>
          </select>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Run
          </button>
        </div>
      </div>

      {/* Prompt input */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt or input here..."
          className="w-full h-40 bg-transparent outline-none resize-none text-sm text-gray-200 placeholder-gray-500"
        />
      </div>

      {/* Output panel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col h-64">
        <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
          {model === "ml" && <Cpu className="w-4 h-4" />}
          {model === "genai" && <Brain className="w-4 h-4" />}
          {model === "hybrid" && <Sparkles className="w-4 h-4" />}
          <span>Model Output</span>
        </div>
        <div className="flex-1 overflow-y-auto text-gray-100 text-sm whitespace-pre-wrap">
          {loading
            ? "⏳ Running model..."
            : output || "No output yet. Run a model to see results."}
        </div>
      </div>
    </div>
  );
}
