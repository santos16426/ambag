"use client";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Simulate a network check
    setTimeout(() => {
      setIsRetrying(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FDFDFD] px-6 text-[#1A1A1A] antialiased">
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        {/* Visual Indicator Area */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-neutral-50 ring-1 ring-neutral-100">
          <div className="relative">
            <WifiOff
              className={`h-10 w-10 text-neutral-400 transition-transform duration-500 ${isRetrying ? "scale-90 opacity-50" : "scale-100"}`}
            />
            {isRetrying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            You&apos;re offline
          </h1>
          <p className="mx-auto max-w-[280px] text-base leading-relaxed text-neutral-500">
            Ambag needs a network connection to load fresh data. Check your
            connection, then try again.
          </p>
        </header>

        {/* Action Controls */}
        <footer className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-70"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRetrying ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            {isRetrying ? "Checking..." : "Try again"}
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </footer>

        {/* Connectivity Hint */}
        <p className="mt-12 text-xs font-medium uppercase tracking-widest text-neutral-400">
          Connection Status: Offline
        </p>
      </div>
    </main>
  );
}
