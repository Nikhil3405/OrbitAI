"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    name: "Overview",
    path: "",
  },
  {
    name: "Quality",
    path: "/quality",
  },
  {
    name: "Cleaning",
    path: "/cleaning",
  },
  {
    name: "Analysis",
    path: "/analysis",
  },
];

export default function DatasetTabs({ datasetId }) {
  const pathname = usePathname();
  const basePath = `/datasets/${datasetId}`;

  return (
    <div className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex min-w-max gap-6">
          {tabs.map((tab) => {
            const href = `${basePath}${tab.path}`;
            const active = pathname === href;

            return (
              <Link
                key={tab.name}
                href={href}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition ${
                  active
                    ? "border-neutral-950 text-neutral-950"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}