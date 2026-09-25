"use client";

import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

export default function AnalysisInput({ onSubmit, loading }) {
  const [question, setQuestion] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!question.trim() || loading) {
      return;
    }

    onSubmit(question.trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            loading ? "bg-neutral-100" : "bg-blue-50"
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
          ) : (
            <Sparkles className="h-4 w-4 text-blue-600" />
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            loading
              ? "OrbitAI is analyzing your question..."
              : "Ask a question about your dataset..."
          }
          disabled={loading}
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-70"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Analyze question"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
}