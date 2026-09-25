"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import UploadDataset from "@/components/datasets/upload-dataset";
import DatasetList from "@/components/datasets/dataset-list";

export default function DatasetsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploaded = () => {
    setRefreshKey((value) => value + 1);
  };

  return (
    <DashboardShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            Workspace
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
            Datasets
          </h1>

          <p className="mt-2 text-sm text-neutral-600">
            Upload, inspect, clean, and analyze your datasets.
          </p>
        </div>

        <div className="mt-8">
          <UploadDataset onUploaded={handleUploaded} />
        </div>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-950">
              Your datasets
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Datasets you've uploaded to OrbitAI.
            </p>
          </div>

          <DatasetList refreshKey={refreshKey} />
        </section>
      </div>
    </DashboardShell>
  );
}