"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

import DatasetCard from "./dataset-card";

import { apiFetch } from "@/lib/api";

export default function DatasetList({ refreshKey = 0 }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const fetchDatasets = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch(
          getToken,
          "/api/datasets",
        );

        setDatasets(data);
      } catch (err) {
        console.error("Failed to load datasets:", err);

        setError(
          err.message || "Failed to load datasets.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [refreshKey, getToken, isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
        Authentication required.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
        {error}
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p className="text-sm font-medium text-neutral-900">
          No datasets yet
        </p>

        <p className="mt-1 text-sm text-neutral-500">
          Upload your first CSV to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {datasets.map((dataset) => (
        <DatasetCard
          key={dataset.id}
          dataset={dataset}
        />
      ))}
    </div>
  );
}