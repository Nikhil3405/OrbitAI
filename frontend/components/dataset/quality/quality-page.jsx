"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@clerk/nextjs";

import QualitySummary from "./quality-summary";
import QualityIssues from "./quality-issues";

import { apiFetch } from "@/lib/api";

export default function QualityPage({ datasetId }) {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !datasetId) {
      return;
    }

    async function loadQuality() {
      try {
        setLoading(true);
        setError("");

        const data = await apiFetch(
          getToken,
          `/api/datasets/${datasetId}/quality`,
        );

        setQuality(data);
      } catch (err) {
        console.error("Failed to load dataset quality:", err);

        setError(
          err.message || "Failed to load dataset quality.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadQuality();
  }, [datasetId, getToken, isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-40 animate-pulse rounded bg-neutral-100" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-neutral-100"
            />
          ))}
        </div>

        <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-700">
        Authentication required.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <QualitySummary quality={quality} />

      <QualityIssues issues={quality?.issues} />
    </div>
  );
}