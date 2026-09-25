"use client";

import { use, useEffect, useState } from "react";

import DatasetDetailShell from "@/components/dataset/dataset-detail-shell";
import QualityPage from "@/components/dataset/quality/quality-page";

import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";

export default function DatasetQualityPage({ params }) {
  const { id } = use(params);

  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function loadDataset() {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch(
          getToken,
          `/api/datasets/${id}`,
        );

        setDataset(data);
      } catch (err) {
        console.error("Failed to load dataset:", err);

        setError(err.message || "Failed to load dataset.");
      } finally {
        setLoading(false);
      }
    }

    loadDataset();
  }, [id, getToken, isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-100" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
          Authentication required.
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Dataset not found."}
        </div>
      </div>
    );
  }

  return (
    <DatasetDetailShell dataset={dataset}>
      <QualityPage datasetId={id} />
    </DatasetDetailShell>
  );
}