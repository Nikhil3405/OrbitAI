"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Database, Loader2, Upload } from "lucide-react";

import DashboardShell from "@/components/dashboard/dashboard-shell";
import DatasetCard from "@/components/datasets/dataset-card";

export default function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setLoading(false);
      setError("You must be signed in.");
      return;
    }

    async function fetchDatasets() {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch(getToken, "/api/datasets");

        setDatasets(data);
      } catch (err) {
        setError(err.message || "Failed to load datasets.");
      } finally {
        setLoading(false);
      }
    }

    fetchDatasets();
  }, [getToken, isLoaded, isSignedIn]);

  const totalRows = datasets.reduce(
    (total, dataset) => total + (dataset.row_count || 0),
    0,
  );

  const readyDatasets = datasets.filter(
    (dataset) =>
      dataset.status !== "profiling_failed" && dataset.status !== "failed",
  ).length;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">Overview</p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-neutral-600">
              Manage your datasets and turn your data into useful insights.
            </p>
          </div>

          <Link
            href="/datasets"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            <Upload className="h-4 w-4" />
            Upload dataset
          </Link>
        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                <Database className="h-4 w-4 text-neutral-700" />
              </div>

              <p className="text-sm text-neutral-500">Datasets</p>
            </div>

            <p className="mt-4 text-2xl font-semibold text-neutral-950">
              {loading ? "—" : datasets.length}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm text-neutral-500">Total rows</p>

            <p className="mt-4 text-2xl font-semibold text-neutral-950">
              {loading ? "—" : totalRows.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <p className="text-sm text-neutral-500">Status</p>

            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-teal-700">
              <span className="h-2 w-2 rounded-full bg-teal-500" />

              {loading
                ? "Loading"
                : readyDatasets === datasets.length
                  ? "Ready"
                  : `${readyDatasets} ready`}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Recent datasets
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Your latest uploaded datasets.
              </p>
            </div>

            {datasets.length > 0 && (
              <Link
                href="/datasets"
                className="hidden items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-950 sm:flex"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white py-16">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            </div>
          ) : datasets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <p className="text-sm font-medium text-neutral-900">
                No datasets yet
              </p>

              <p className="mt-1 text-sm text-neutral-500">
                Upload your first CSV or XLSX file to get started.
              </p>

              <Link
                href="/datasets"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <Upload className="h-4 w-4" />
                Upload dataset
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {datasets.slice(0, 6).map((dataset) => (
                <DatasetCard key={dataset.id} dataset={dataset} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
