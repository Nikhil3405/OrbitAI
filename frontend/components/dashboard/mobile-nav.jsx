"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Settings,
} from "lucide-react";

import Logo from "@/components/brand/logo";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Datasets",
    href: "/datasets",
    icon: Database,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Logo size="md" />

        <nav className="flex items-center gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.name}
                title={item.name}
                className={`rounded-lg p-2.5 transition ${
                  active
                    ? "bg-neutral-100 text-neutral-950"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
                }`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}