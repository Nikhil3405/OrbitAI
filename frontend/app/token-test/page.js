"use client";

import { useAuth } from "@clerk/nextjs";

export default function TokenTestPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  async function showToken() {
    if (!isSignedIn) {
      console.log("User is not signed in.");
      return;
    }

    const token = await getToken();

    console.log("========== CLERK JWT ==========");
    console.log(token);
    console.log("================================");
  }

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="p-8">
        Please sign in first.
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <button
        onClick={showToken}
        className="rounded-lg bg-black px-6 py-3 text-white"
      >
        Get JWT
      </button>
    </main>
  );
}