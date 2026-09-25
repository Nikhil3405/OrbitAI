"use client";

import { useRef, useState } from "react";

import {
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";

export default function UploadDataset({ onUploaded }) {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { getToken, isLoaded, isSignedIn } = useAuth();

  const handleFile = (selectedFile) => {
    setError("");
    setSuccess(false);

    if (!selectedFile) return;

    const extension = selectedFile.name
      .toLowerCase()
      .split(".")
      .pop();

    if (!["csv", "xlsx", "xls"].includes(extension)) {
      setError("Please select a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);
  };

  const handleInputChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!isLoaded || !isSignedIn) {
      setError("Authentication required.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const data = await apiFetch(
        getToken,
        "/api/datasets/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      setSuccess(true);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      onUploaded?.(data);
    } catch (err) {
      console.error("Dataset upload failed:", err);

      setError(
        err.message || "Something went wrong while uploading.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-neutral-950">
          Upload dataset
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          Upload a CSV file to start analyzing your data.
        </p>
      </div>

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center transition hover:border-neutral-400 hover:bg-neutral-100"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
            <Upload className="h-5 w-5 text-neutral-700" />
          </div>

          <p className="mt-4 text-sm font-medium text-neutral-900">
            Drop your CSV here or click to browse
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            CSV and Excel files supported
          </p>
        </button>
      ) : (
        <div className="rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
              <FileSpreadsheet className="h-5 w-5 text-teal-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-950">
                {file.name}
              </p>

              <p className="mt-0.5 text-xs text-neutral-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>

            {!uploading && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !isLoaded || !isSignedIn}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload dataset"
            )}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleInputChange}
        className="hidden"
      />

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2.5 text-sm text-teal-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Dataset uploaded successfully.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-orange-50 px-3 py-2.5 text-sm text-orange-700">
          {error}
        </div>
      )}
    </div>
  );
}