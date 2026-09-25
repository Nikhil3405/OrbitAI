"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import CleaningOperation from "./cleaning-operation";

export default function CleaningPlan({
  plan,
  status,
  onApprove,
  onReject,
  onExecute,
  loading,
}) {
  const operations = plan?.operations || [];

  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isExecuted = status === "executed";
  const isRejected = status === "rejected";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-neutral-950">
                AI Cleaning Plan
              </h3>

              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                  <Clock3 className="h-3 w-3" />
                  Awaiting approval
                </span>
              )}

              {isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </span>
              )}

              {isExecuted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </span>
              )}

              {isRejected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  <XCircle className="h-3 w-3" />
                  Rejected
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-neutral-500">
              Review the operations OrbitAI proposes before any data is changed.
            </p>
          </div>

          <div className="shrink-0 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
            {operations.length}{" "}
            {operations.length === 1 ? "operation" : "operations"}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {operations.map((operation, index) => (
          <CleaningOperation
            key={`${operation.operation}-${index}`}
            operation={operation}
            index={index}
          />
        ))}
      </div>

      {isPending && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />

            <div>
              <p className="text-sm font-medium text-orange-900">
                Review before approving
              </p>

              <p className="mt-1 text-sm leading-6 text-orange-800">
                These operations may modify or remove data. Nothing will
                be changed until you approve the plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reject Plan
          </button>

          <button
            type="button"
            onClick={onApprove}
            disabled={loading}
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processing..." : "Approve Plan"}
          </button>
        </div>
      )}

      {isApproved && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Plan approved
              </p>

              <p className="mt-1 text-sm text-blue-800">
                The approved operations are ready to be applied.
              </p>
            </div>

            <button
              type="button"
              onClick={onExecute}
              disabled={loading}
              className="shrink-0 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Cleaning..." : "Apply Cleaning"}
            </button>
          </div>
        </div>
      )}

      {isExecuted && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />

            <div>
              <p className="text-sm font-medium text-teal-900">
                Cleaning completed successfully
              </p>

              <p className="mt-1 text-sm text-teal-800">
                The cleaned dataset has been created and the dataset
                profile has been updated.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}