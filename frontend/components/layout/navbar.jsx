"use client";

import Link from "next/link";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

import Logo from "@/components/brand/logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo size="lg" priority />

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-sm text-neutral-600 transition hover:text-neutral-950"
          >
            Features
          </Link>

          <Link
            href="/#workflow"
            className="text-sm text-neutral-600 transition hover:text-neutral-950"
          >
            How it works
          </Link>
        </nav>

        {/* Authentication */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="hidden text-sm font-medium text-neutral-700 transition hover:text-neutral-950 sm:block">
                Sign in
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800">
                Get started
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link
              href="/settings"
              className="hidden text-sm font-medium text-neutral-600 transition hover:text-neutral-950 sm:block"
            >
              Settings
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Open dashboard
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}