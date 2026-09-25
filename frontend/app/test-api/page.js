"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import { apiFetch } from "@/lib/api";

export default function TestApiPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function testApi() {
      try {
        const data = await apiFetch(
          "/api/datasets",
          {},
          getToken
        );

        setResult(data);
      } catch (err) {
        setError(err.message);
      }
    }

    testApi();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded) {
    return <p>Loading authentication...</p>;
  }

  if (!isSignedIn) {
    return <p>Please sign in first.</p>;
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        API Test
      </h1>

      {error && (
        <p className="mt-4 text-red-500">
          Error: {error}
        </p>
      )}

      {result && (
        <pre className="mt-4 rounded-lg border p-4">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}