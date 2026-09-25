"use client";

import { useState } from "react";
import { BarChart3, Sparkles, AlertCircle } from "lucide-react";

import AnalysisInput from "./analysis-input";
import AnalysisActions from "./analysis-actions";
import AnalysisChart from "./analysis-chart";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";

export default function AnalysisPage({ datasetId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");

  const { getToken } = useAuth();

  async function handleAnalyze(question) {
    if (!question.trim()) return;

    const trimmedQuestion = question.trim();

    setSubmittedQuestion(trimmedQuestion);
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await apiFetch(
        getToken,
        `/api/datasets/${datasetId}/analyze`,
        {
          method: "POST",
          body: JSON.stringify({
            question: trimmedQuestion,
          }),
        },
      );

      console.log("Analysis response:", data);
      console.log("Charts:", data.charts);

      setResult(data);
    } catch (err) {
      console.error("Analysis failed:", err);

      setError(
        err.message || "Unable to analyze the dataset. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 pb-10">
      {/* Page heading */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
            <Sparkles className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              AI Analysis
            </h2>

            <p className="text-sm text-neutral-500">
              Ask questions about your dataset using natural language.
            </p>
          </div>
        </div>
      </div>

      {/* Input */}
      <AnalysisInput onSubmit={handleAnalyze} loading={loading} />

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-medium text-red-800">
              Analysis failed
            </p>

            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Question */}
          <section className="rounded-xl border border-neutral-200 bg-white px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Your question
                </p>

                <p className="mt-1 text-sm leading-6 text-neutral-800">
                  {submittedQuestion}
                </p>
              </div>
            </div>
          </section>

          {/* AI Answer */}
          <section className="rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                  <Sparkles className="h-4 w-4 text-neutral-700" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    OrbitAI
                  </h3>

                  <p className="text-xs text-neutral-500">
                    Analysis result
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <AnswerRenderer answer={result.answer} />
            </div>
          </section>

          {/* Charts */}
          {result.charts?.length > 0 && (
            <section className="space-y-5">
              {result.charts.map((chart, index) => (
                <div
                  key={`${chart.title || "chart"}-${index}`}
                  className="rounded-xl border border-neutral-200 bg-white p-6"
                >
                  <div className="mb-5 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">
                      <BarChart3 className="h-4 w-4 text-neutral-700" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {chart.title || "Analysis Chart"}
                      </h3>

                      {chart.x_axis && chart.y_axis && (
                        <p className="text-xs text-neutral-500">
                          {chart.x_axis} · {formatLabel(chart.y_axis)}
                        </p>
                      )}
                    </div>
                  </div>

                  <AnalysisChart chart={chart} />
                </div>
              ))}
            </section>
          )}

          {/* Agent activity */}
          {result.actions?.length > 0 && (
            <section className="rounded-xl border border-neutral-200 bg-white">
              <div className="border-b border-neutral-100 px-6 py-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  How OrbitAI analyzed this
                </h3>

                <p className="mt-1 text-xs text-neutral-500">
                  A brief summary of the analysis steps used to answer your
                  question.
                </p>
              </div>

              <div className="px-6 py-4">
                <AnalysisActions actions={result.actions} />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Answer renderer
------------------------------------------------------- */

function AnswerRenderer({ answer }) {
  const cleaned = cleanAnswer(answer);

  if (!cleaned) {
    return (
      <p className="text-sm text-neutral-500">
        No explanation was returned for this analysis.
      </p>
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-neutral-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              {children}
            </h2>
          ),

          h2: ({ children }) => (
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="mb-3 text-base font-semibold text-neutral-900">
              {children}
            </h3>
          ),

          p: ({ children }) => (
            <p className="mb-4 text-sm leading-7 text-neutral-700 last:mb-0">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-900">
              {children}
            </strong>
          ),

          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-neutral-700">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="leading-6">{children}</li>
          ),

          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full min-w-105 text-sm">
                {children}
              </table>
            </div>
          ),

          thead: ({ children }) => (
            <thead className="bg-neutral-50">{children}</thead>
          ),

          tbody: ({ children }) => <tbody>{children}</tbody>,

          tr: ({ children }) => (
            <tr className="border-b border-neutral-100 last:border-0">
              {children}
            </tr>
          ),

          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="px-4 py-3 text-neutral-700">
              {children}
            </td>
          ),

          code: ({ children }) => (
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700">
              {children}
            </code>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

function cleanAnswer(answer) {
  if (!answer) return "";

  return answer
    .replace(/【[^】]*】/g, "")
    .replace(/\[execute_sql result\]/gi, "")
    .replace(/\[create_chart result\]/gi, "")
    .trim();
}

function formatLabel(value) {
  if (!value) return "";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}