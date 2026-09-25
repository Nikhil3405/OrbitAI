"use client";

import DashboardShell from "@/components/dashboard/dashboard-shell";

import { useClerk, useUser } from "@clerk/nextjs";

import {
  LogOut,
  User,
  Brain,
  Database,
  Info,
  LockKeyhole,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

import { useState } from "react";

export default function SettingsPage() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleLogout = async () => {
    await signOut({
      redirectUrl: "/",
    });
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);

      await user.updatePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess("Your password has been changed successfully.");
    } catch (error) {
      setPasswordError(
        error?.errors?.[0]?.longMessage ||
          error?.errors?.[0]?.message ||
          "Unable to change your password. Please check your current password.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <DashboardShell>
      <main className="min-h-full bg-neutral-50">
        <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
              Settings
            </h1>

            <p className="mt-1 text-sm text-neutral-500">
              Manage your OrbitAI account and preferences.
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile */}
            <section className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <User className="h-4 w-4 text-neutral-700" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">
                    Profile
                  </h2>

                  <p className="text-xs text-neutral-500">
                    Your account information
                  </p>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-neutral-500">
                    Name
                  </p>

                  <p className="text-sm text-neutral-900">
                    {user?.fullName || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-neutral-500">
                    Email
                  </p>

                  <p className="text-sm text-neutral-900">
                    {user?.primaryEmailAddress?.emailAddress ||
                      "Not available"}
                  </p>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <LockKeyhole className="h-4 w-4 text-neutral-700" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">
                    Security
                  </h2>

                  <p className="text-xs text-neutral-500">
                    Manage your account password
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleChangePassword}
                className="space-y-5 px-6 py-6"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                    Current password
                  </label>

                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      placeholder="Enter current password"
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                    New password
                  </label>

                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(!showNewPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs text-neutral-400">
                    Use at least 8 characters.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                    Confirm new password
                  </label>

                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm new password"
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 pr-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
                    <Check className="h-4 w-4" />
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isChangingPassword
                      ? "Changing password..."
                      : "Change password"}
                  </button>
                </div>
              </form>
            </section>

            {/* AI */}
            <section className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <Brain className="h-4 w-4 text-neutral-700" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">
                    AI
                  </h2>

                  <p className="text-xs text-neutral-500">
                    AI configuration used by OrbitAI
                  </p>
                </div>
              </div>

              <div className="divide-y divide-neutral-100">
                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      AI Provider
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Provider used for dataset analysis
                    </p>
                  </div>

                  <span className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                    Groq
                  </span>
                </div>

                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Agent behavior
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      AI suggests actions while data changes require approval
                    </p>
                  </div>

                  <span className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                    Approval required
                  </span>
                </div>
              </div>
            </section>

            {/* Data */}
            <section className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <Database className="h-4 w-4 text-neutral-700" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">
                    Data
                  </h2>

                  <p className="text-xs text-neutral-500">
                    Dataset processing preferences
                  </p>
                </div>
              </div>

              <div className="divide-y divide-neutral-100">
                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Supported formats
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      File formats accepted by OrbitAI
                    </p>
                  </div>

                  <span className="text-xs font-medium text-neutral-600">
                    CSV, XLSX
                  </span>
                </div>

                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Cleaning approval
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Destructive cleaning operations always require approval
                    </p>
                  </div>

                  <span className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600">
                    Required
                  </span>
                </div>
              </div>
            </section>

            {/* About */}
            <section className="rounded-xl border border-neutral-200 bg-white">
              <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <Info className="h-4 w-4 text-neutral-700" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-950">
                    About
                  </h2>

                  <p className="text-xs text-neutral-500">
                    Information about OrbitAI
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    OrbitAI
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Agentic AI Data Analyst
                  </p>
                </div>

                <span className="text-xs text-neutral-400">v1.0.0</span>
              </div>
            </section>

            {/* Account */}
            <section className="rounded-xl border border-red-100 bg-white">
              <div className="border-b border-red-100 px-6 py-5">
                <h2 className="text-sm font-semibold text-neutral-950">
                  Account
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  Manage your current session
                </p>
              </div>

              <div className="flex items-center justify-between px-6 py-5">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Log out
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    Sign out of your OrbitAI account
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </DashboardShell>
  );
}