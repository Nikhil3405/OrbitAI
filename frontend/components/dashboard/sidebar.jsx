"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";

import {
  LayoutDashboard,
  Database,
  Settings,
  LogOut,
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

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogout = async () => {
    await signOut({
      redirectUrl: "/",
    });
  };

  return (
    <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col ">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <Logo size="md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-neutral-100 text-neutral-950"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-xs font-semibold text-neutral-700">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              user?.firstName?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900">
              {user?.fullName || "User"}
            </p>

            <p className="truncate text-xs text-neutral-500">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}