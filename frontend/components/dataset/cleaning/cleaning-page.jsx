"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";

import CleaningPlan from "./cleaning-plan";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";

const AUDIT_PAGE_SIZE = 10;

export default function CleaningPage({ datasetId }) {
  const [plan, setPlan] = useState(null);
  const [status, setStatus] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [cleaningCompleted, setCleaningCompleted] = useState(false);

  const [removedRows, setRemovedRows] = useState([]);
  const [auditPage, setAuditPage] = useState(1);

  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCleaningState();
  }, [datasetId]);

  async function generatePlan() {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch(
        getToken,
        `/api/datasets/${datasetId}/cleaning-plan`,
        {
          method: "POST",
        },
      );

      setPlan(data.plan);
      setPlanId(data.id);
      setStatus(data.status);
      setCleaningCompleted(false);
      setAuditPage(1);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateApproval(approved) {
    if (!plan || !planId) return;

    try {
      setLoading(true);
      setError("");

      const data = await apiFetch(getToken, `/api/cleaning/${planId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          approved,
        }),
      });

      setStatus(data.status);

      if (!approved) {
        setPlan(null);
        setPlanId(null);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function executePlan() {
    if (!plan || !planId) return;

    try {
      setLoading(true);
      setError("");

      await apiFetch(getToken, `/api/cleaning/${planId}/execute`, {
        method: "POST",
      });

      await loadCleaningState();
    } catch (error) {
      setStatus("failed");
      setPlan(null);
      setPlanId(null);
      setCleaningCompleted(false);
      setError(
        error.message ||
          "Cleaning failed. Your original dataset was not modified.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCleaningState() {
    try {
      setInitialLoading(true);
      setLoadingAudit(true);
      setError("");

      /*
       * Clear previous UI state while refreshing.
       * This prevents stale cleaning information from being displayed.
       */
      setPlan(null);
      setPlanId(null);
      setStatus(null);
      setCleaningCompleted(false);
      setRemovedRows([]);
      setAuditPage(1);

      const [statusData, auditData] = await Promise.all([
        apiFetch(getToken, `/api/datasets/${datasetId}/cleaning-status`),

        /*
         * Important:
         * Removed rows belongs to the cleaning router.
         */
        apiFetch(getToken, `/api/cleaning/${datasetId}/removed-rows`),
      ]);

      const completed = Boolean(statusData.cleaning_completed);

      setStatus(statusData.status);
      setPlanId(statusData.plan_id);
      setCleaningCompleted(completed);

      /*
       * Restore the active plan after backend state has loaded.
       */
      if (statusData.plan && !completed) {
        setPlan(statusData.plan);
      } else {
        setPlan(null);
      }

      setRemovedRows(auditData.rows || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingAudit(false);
      setInitialLoading(false);
    }
  }
  async function downloadCleanedDataset() {
    try {
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/cleaning/${datasetId}/download?format=csv`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to download cleaned dataset.");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "cleaned_dataset.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download cleaned dataset:", error);
      setError(error.message || "Failed to download cleaned dataset.");
    }
  }

  /*
   * Initial loading screen.
   */
  if (initialLoading) {
    return (
      <div className="space-y-8 p-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-950">
            Data Cleaning
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Loading cleaning status...
          </p>
        </div>

        <div className="flex min-h-60 items-center justify-center rounded-xl border border-neutral-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />

            <p className="text-sm text-neutral-500">
              Loading cleaning state...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-950">
          Data Cleaning
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Let OrbitAI analyze the detected quality issues and propose
          deterministic cleaning operations.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Failed state */}
      {status === "failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Cleaning failed</h3>

              <p className="mt-1 text-sm leading-6 text-red-700">
                OrbitAI could not complete the approved cleaning plan. Your
                original dataset was not modified.
              </p>

              <button
                type="button"
                onClick={() => {
                  setStatus(null);
                  setPlan(null);
                  setPlanId(null);
                  setError("");
                }}
                className="mt-4 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Generate New Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download */}
      {cleaningCompleted && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-neutral-950">
                Download cleaned dataset
              </h3>

              <p className="mt-1 text-sm text-neutral-500">
                Download the cleaned dataset as a CSV file.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadCleanedDataset}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </section>
      )}

      {/* Generate cleaning plan */}
      {!plan && !cleaningCompleted && status !== "failed" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-neutral-950">
                Generate an AI cleaning plan
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                OrbitAI will review the dataset profile and suggest cleaning
                operations. Your data will not be modified until you explicitly
                approve the plan.
              </p>
            </div>

            <button
              type="button"
              onClick={generatePlan}
              disabled={loading}
              className="w-full shrink-0 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? "Generating..." : "Generate Cleaning Plan"}
            </button>
          </div>
        </div>
      )}

      {/* Rejected state */}
      {status === "rejected" && !cleaningCompleted && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
              <AlertCircle className="h-5 w-5 text-neutral-600" />
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-neutral-950">
                Cleaning plan rejected
              </h3>

              <p className="mt-1 text-sm leading-6 text-neutral-500">
                The previous cleaning plan was rejected. Your original dataset
                was not modified.
              </p>

              <button
                type="button"
                onClick={() => {
                  setStatus(null);
                  setPlan(null);
                  setPlanId(null);
                  setError("");
                }}
                className="mt-4 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Generate New Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleaning completed */}
      {!plan && cleaningCompleted && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
            </div>

            <div>
              <h3 className="font-semibold text-neutral-950">
                Cleaning completed
              </h3>

              <p className="mt-1 text-sm leading-6 text-neutral-500">
                This dataset has already been cleaned. The removed rows and
                cleaning audit are available below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active cleaning plan */}
      {plan && (
        <>
          {/* Cleaning impact */}
          {plan.impact && (
            <section className="rounded-xl border border-neutral-200 bg-white p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-950">
                    Cleaning impact
                  </p>

                  <p className="mt-1 text-sm text-neutral-500">
                    OrbitAI expects to remove{" "}
                    <span className="font-semibold text-neutral-900">
                      {plan.impact.rows_to_remove}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-neutral-900">
                      {plan.impact.total_rows}
                    </span>{" "}
                    rows.
                  </p>
                </div>

                <div className="shrink-0 rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700">
                  {plan.impact.rows_remaining} remaining
                </div>
              </div>
            </section>
          )}

          <CleaningPlan
            plan={plan}
            status={status}
            onApprove={() => updateApproval(true)}
            onReject={() => updateApproval(false)}
            onExecute={executePlan}
            loading={loading}
          />
        </>
      )}

      {/* Cleaning audit */}
      <section className="rounded-xl border border-neutral-200 bg-white">
        <CleaningAudit
          rows={removedRows}
          loading={loadingAudit}
          cleaningCompleted={cleaningCompleted}
          page={auditPage}
          pageSize={AUDIT_PAGE_SIZE}
          onPageChange={setAuditPage}
        />
      </section>
    </div>
  );
}

function formatOperation(operation) {
  return String(operation || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function CleaningAudit({
  rows,
  loading,
  cleaningCompleted,
  page,
  pageSize,
  onPageChange,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!cleaningCompleted) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-neutral-50 p-4">
          <p className="text-sm font-medium text-neutral-900">
            Cleaning has not been run yet
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            Once you approve and execute a cleaning plan, removed rows will
            appear here.
          </p>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-teal-600" />

          <div>
            <p className="text-sm font-medium text-neutral-900">
              No rows removed
            </p>

            <p className="mt-1 text-xs text-neutral-500">
              OrbitAI did not remove any rows during cleaning.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(rows.length / pageSize);
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const visibleRows = rows.slice(startIndex, endIndex);

  return (
    <div>
      <div className="divide-y divide-neutral-200">
        {visibleRows.map((row) => (
          <div key={row.id} className="p-6">
            {/* Row information */}
            <div className="grid gap-4 sm:grid-cols-[120px_180px_1fr]">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Original row
                </p>

                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {row.original_row}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Operation
                </p>

                <p className="mt-1 text-sm font-medium text-neutral-700">
                  {formatOperation(row.operation)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                  Reason
                </p>

                <p className="mt-1 text-sm text-neutral-600">{row.reason}</p>
              </div>
            </div>

            {/* Removed row data */}
            <div className="mt-5 overflow-hidden rounded-lg border border-neutral-200">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Removed row data
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-left text-sm">
                  <thead className="border-b border-neutral-100">
                    <tr>
                      {Object.keys(row.row_data || {}).map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-4 py-3 text-xs font-medium text-neutral-500"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    <tr>
                      {Object.entries(row.row_data || {}).map(
                        ([column, value]) => (
                          <td
                            key={column}
                            className="whitespace-nowrap px-4 py-3 text-neutral-800"
                          >
                            {formatCellValue(value)}
                          </td>
                        ),
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-neutral-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            Showing {startIndex + 1}–{Math.min(endIndex, rows.length)} of{" "}
            {rows.length} removed rows
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(safePage - 1, 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700">
              {safePage} / {totalPages}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(Math.min(safePage + 1, totalPages))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}
