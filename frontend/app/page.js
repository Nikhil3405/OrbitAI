"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronRight,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";

import { SignUpButton, Show } from "@clerk/nextjs";

import Logo from "@/components/brand/logo";
import Navbar from "@/components/layout/navbar";

const features = [
  {
    icon: Database,
    title: "Understand your data",
    description:
      "Upload a CSV or XLSX dataset and OrbitAI automatically profiles its structure, columns, missing values, duplicates, data types, and quality issues.",
    accent: "blue",
  },
  {
    icon: WandSparkles,
    title: "Clean with control",
    description:
      "OrbitAI generates a cleaning plan, explains the proposed operations, and waits for your approval before making destructive changes.",
    accent: "orange",
  },
  {
    icon: BrainCircuit,
    title: "Ask questions naturally",
    description:
      "Ask questions in plain English and let the AI agent choose the right analytical tools to find the answer.",
    accent: "teal",
  },
  {
    icon: BarChart3,
    title: "Get validated insights",
    description:
      "Answers come from real SQL and statistical computation, with charts generated from structured analytical results.",
    accent: "blue",
  },
];

const workflow = [
  {
    number: "01",
    title: "Upload",
    description: "Upload a CSV or XLSX dataset.",
  },
  {
    number: "02",
    title: "Profile",
    description: "OrbitAI automatically analyzes its structure and quality.",
  },
  {
    number: "03",
    title: "Review & clean",
    description: "Review and approve the AI-generated cleaning plan.",
  },
  {
    number: "04",
    title: "Analyze",
    description: "Ask questions and get validated results and charts.",
  },
];

const accentClasses = {
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  teal: "bg-teal-50 text-teal-600 ring-teal-100",
  orange: "bg-orange-50 text-orange-600 ring-orange-100",
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-neutral-950">
      {/* Navigation */}
      <Navbar />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-125 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_55%)]" />

        <div className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-medium text-neutral-600"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Agentic AI Data Analysis
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-4xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-6xl lg:text-7xl"
            >
              Turn raw data into
              <span className="block">
                <span className="text-blue-600">clear insights.</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg"
            >
              Upload your dataset, let OrbitAI understand and clean it with
              your approval, then ask questions in plain English. Real
              computation, validated results, and useful visualizations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 sm:w-auto">
                    Start analyzing
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </SignUpButton>
              </Show>

              <Show when="signed-in">
                <a
                  href="/dashboard"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 sm:w-auto"
                >
                  Open dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Show>

              <a
                href="#workflow"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 px-6 py-3.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 sm:w-auto"
              >
                See how it works
                <ChevronRight className="h-4 w-4" />
              </a>
            </motion.div>
          </div>

          {/* Product Preview */}
          {/* Product Preview */}
<motion.div
  initial={{ opacity: 0, y: 35 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.25 }}
  className="mx-auto mt-16 max-w-5xl"
>
  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_25px_80px_-30px_rgba(0,0,0,0.25)]">
    {/* Browser header */}
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
      <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
      <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />

      <div className="mx-auto hidden h-7 w-64 rounded-md border border-neutral-200 bg-white sm:block" />
    </div>

    <div className="grid min-h-87.5 md:grid-cols-[190px_1fr]">
      {/* Sidebar */}
      <div className="hidden border-r border-neutral-200 bg-white p-4 md:block">
        <div className="mb-7 flex items-center gap-2">
          <Logo />
        </div>

        <div className="space-y-1">
          {[
            "Dashboard",
            "Datasets",
            "Settings",
          ].map((item, index) => (
            <div
              key={item}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                index === 0
                  ? "bg-neutral-100 text-neutral-950"
                  : "text-neutral-500"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Profile preview */}
        <div className="mt-auto pt-20">
          <div className="border-t border-neutral-200 pt-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600">
                U
              </div>

              <div className="min-w-0">
                <div className="truncate text-[10px] font-medium text-neutral-800">
                  User
                </div>
                <div className="truncate text-[9px] text-neutral-400">
                  Account
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="p-5 sm:p-7">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="text-lg font-semibold text-neutral-950">
              Dashboard
            </div>

            <div className="mt-1 text-xs text-neutral-400">
              Manage your datasets and turn your data into useful insights.
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-neutral-950 px-3 py-2 text-xs font-medium text-white">
            <Upload className="h-3.5 w-3.5" />
            Upload dataset
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-xs text-neutral-400">
              Datasets
            </div>

            <div className="mt-2 text-xl font-semibold text-neutral-950">
              03
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-xs text-neutral-400">
              Total rows
            </div>

            <div className="mt-2 text-xl font-semibold text-neutral-950">
              12.4K
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-xs text-neutral-400">
              Status
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-teal-600">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Ready
            </div>
          </div>
        </div>

        {/* Recent datasets */}
        <div className="mt-5 rounded-xl border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <div>
              <div className="text-xs font-semibold text-neutral-800">
                Recent datasets
              </div>

              <div className="mt-0.5 text-[10px] text-neutral-400">
                Your latest uploaded datasets
              </div>
            </div>

            <div className="text-[10px] font-medium text-neutral-500">
              View all →
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {[
              {
                name: "sales_data.csv",
                rows: "970 rows",
                status: "Ready",
              },
              {
                name: "customer_data.xlsx",
                rows: "2,430 rows",
                status: "Ready",
              },
              {
                name: "orders.csv",
                rows: "8,120 rows",
                status: "Ready",
              },
            ].map((dataset) => (
              <div
                key={dataset.name}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                    <Database className="h-3.5 w-3.5 text-neutral-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-medium text-neutral-800">
                      {dataset.name}
                    </div>

                    <div className="mt-0.5 text-[10px] text-neutral-400">
                      {dataset.rows}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] font-medium text-teal-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                  {dataset.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom insight */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />

            <span className="text-[10px] font-medium text-blue-700">
              Ready for AI-powered analysis
            </span>
          </div>

          <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
        </div>
      </div>
    </div>
  </div>
</motion.div>
        </div>
      </section>

      {/* Trust / positioning */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:px-8 md:flex-row lg:px-10">
          <p className="text-center text-sm text-neutral-500 md:text-left">
            AI-assisted analysis backed by deterministic data processing.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-neutral-400">
            <span>DuckDB</span>
            <span>Groq</span>
            <span>FastAPI</span>
            <span>Next.js</span>
            <span>PostgreSQL</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-blue-600">
              One workflow for your data
            </div>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              From messy dataset to useful insight.
            </h2>

            <p className="mt-4 text-base leading-7 text-neutral-500">
              OrbitAI combines deterministic data processing with an AI agent
              that decides which analytical tools to use.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-100 sm:p-7"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
                      accentClasses[feature.accent]
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-6 text-lg font-semibold text-neutral-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agent section */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300">
                <Zap className="h-3.5 w-3.5 text-blue-400" />
                Agentic by design
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                The AI decides what to do.
                <span className="block text-neutral-400">
                  Your data engine does the work.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-400 sm:text-base">
                OrbitAI uses an AI agent to plan analysis while deterministic
                tools perform the actual computation. Your entire dataset is
                never placed into the language model context.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Your dataset stays outside the LLM context",
                  "DuckDB performs the actual SQL computation",
                  "Statistical tools calculate and validate results",
                  "Destructive cleaning requires your approval",
                  "Charts are generated from analytical results",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-sm text-neutral-300"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                      <Check className="h-3 w-3 text-teal-400" />
                    </div>

                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Agent visualization */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-7">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <div className="text-sm font-medium">
                    Agent activity
                  </div>

                  <div className="mt-1 text-xs text-neutral-500">
                    Revenue analysis
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-teal-400">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
                  Complete
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  {
                    label: 'Interpreted "sales" → Revenue',
                    color: "blue",
                  },
                  {
                    label: "Executed revenue aggregation",
                    color: "teal",
                  },
                  {
                    label: "Validated analytical result",
                    color: "teal",
                  },
                  {
                    label: "Generated visualization",
                    color: "orange",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-950 p-3"
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.color === "blue"
                          ? "bg-blue-400"
                          : item.color === "teal"
                            ? "bg-teal-400"
                            : "bg-orange-400"
                      }`}
                    />

                    <span className="text-xs text-neutral-300">
                      {item.label}
                    </span>

                    <Check className="ml-auto h-3.5 w-3.5 text-neutral-600" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
          <div className="text-center">
            <div className="text-sm font-semibold text-teal-600">
              Simple workflow
            </div>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              From upload to insight in four steps.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-neutral-500">
              OrbitAI keeps the workflow simple while giving you control over
              every data-changing operation.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className="relative rounded-2xl border border-neutral-200 p-6"
              >
                <div className="text-xs font-semibold text-neutral-400">
                  {step.number}
                </div>

                <h3 className="mt-8 text-lg font-semibold">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {step.description}
                </p>

                {index < workflow.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-white text-neutral-300 lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Data control section */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-teal-600" />

            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              You stay in control of your data.
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-500 sm:text-base">
              OrbitAI separates AI planning from deterministic data
              processing. Proposed cleaning operations are shown before
              execution, and destructive changes require your approval.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              {
                title: "Review",
                description:
                  "See what OrbitAI proposes before your dataset is changed.",
              },
              {
                title: "Approve",
                description:
                  "Destructive cleaning operations require explicit approval.",
              },
              {
                title: "Validate",
                description:
                  "The cleaned dataset is re-profiled after execution.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-neutral-200 bg-white p-6"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <Check className="h-4 w-4 text-teal-600" />
                </div>

                <h3 className="mt-5 text-sm font-semibold text-neutral-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-neutral-950 px-6 py-14 text-center sm:px-10 sm:py-20">
          <FileSpreadsheet className="mx-auto h-8 w-8 text-blue-400" />

          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your data deserves more than a chatbot.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-400 sm:text-base">
            Upload a dataset, understand its quality, clean it with control,
            and ask questions that are answered using real computation.
          </p>

          <div className="mt-8">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </a>
            </Show>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-2">
            <Logo />
          </div>

          <p className="text-xs text-neutral-400">
            Agentic AI Data Analyst
          </p>
        </div>
      </footer>
    </main>
  );
}