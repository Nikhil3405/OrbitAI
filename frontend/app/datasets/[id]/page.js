"use client";

import {use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import DatasetDetailShell from "@/components/dataset/dataset-detail-shell";
import DatasetSummary from "@/components/dataset/overview/dataset-summary";
import ColumnTable from "@/components/dataset/overview/column-table";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

export default function DatasetPage({ params }) {
  const { id } = use(params);

  const [dataset, setDataset] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const loadDataset = async () => {
      try {
        setLoading(true);
        setError("");

        const [datasetData, profileData] = await Promise.all([
          apiFetch(getToken, `/api/datasets/${id}`),
          apiFetch(getToken, `/api/datasets/${id}/profile`),
        ]);

        console.log("Dataset data:", datasetData);
        console.log("Profile data:", profileData);

        setDataset(datasetData);
        setProfile(profileData);
      } catch (err) {
        console.error("Failed to load dataset:", err);

        setError(err.message || "Failed to load dataset.");
      } finally {
        setLoading(false);
      }
    };

    loadDataset();
  }, [id, getToken, isLoaded, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-700">
          Authentication required.
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 text-sm text-orange-700">
          {error || "Dataset not found."}
        </div>
      </div>
    );
  }

  return (
    <DatasetDetailShell dataset={dataset}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Overview
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Understand the structure and basic quality of your dataset.
          </p>
        </div>

        <div className="mt-6">
          <DatasetSummary
            dataset={dataset}
            profile={profile}
          />
        </div>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-950">
              Columns
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Column types, missing values, unique values, and statistics.
            </p>
          </div>

          <ColumnTable columns={profile?.columns || []} />
        </section>
      </div>
    </DatasetDetailShell>
  );
}