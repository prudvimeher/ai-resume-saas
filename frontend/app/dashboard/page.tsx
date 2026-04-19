"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ScoreCard from "@/components/dashboard/ScoreCard";
import Navbar from "@/components/layout/Navbar";

const suggestions = [
  "Add more project outcomes with measurable results.",
  "Improve the summary so it matches the target role.",
  "Use stronger action words in recent experience bullets.",
];

export default function DashboardPage() {
  const router = useRouter();
  const [hasToken] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(localStorage.getItem("token"));
  });

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
    }
  }, [hasToken, router]);

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-950">
        <Navbar />

        <section className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-6 py-16 lg:px-8">
          <p className="text-sm font-medium text-zinc-500">
            Loading dashboard...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />

      <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Dashboard
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Your resume insights
          </h1>
        </div>

        <ScoreCard score={78} suggestions={suggestions} />
      </section>
    </main>
  );
}
