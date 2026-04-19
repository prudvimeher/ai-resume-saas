"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

type NavbarProps = {
  variant?: "dark" | "light";
};

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "Process", href: "/#process" },
];

function subscribeToTokenChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("auth-token-changed", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("auth-token-changed", onStoreChange);
  };
}

function getTokenSnapshot() {
  return Boolean(localStorage.getItem("token"));
}

function getServerTokenSnapshot() {
  return false;
}

export default function Navbar({ variant = "light" }: NavbarProps) {
  const router = useRouter();
  const hasToken = useSyncExternalStore(
    subscribeToTokenChanges,
    getTokenSnapshot,
    getServerTokenSnapshot,
  );
  const isDark = variant === "dark";
  const brandClassName = isDark
    ? "text-base font-semibold text-white"
    : "text-base font-semibold text-zinc-950";
  const navClassName = isDark
    ? "hidden items-center gap-8 text-sm text-zinc-200 md:flex"
    : "hidden items-center gap-8 text-sm text-zinc-600 md:flex";
  const navLinkClassName = isDark
    ? "transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-4 focus:ring-offset-zinc-950"
    : "transition-colors hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:ring-offset-4";
  const textButtonClassName = isDark
    ? "text-sm font-semibold text-zinc-100 transition hover:text-white hover:underline focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-4 focus:ring-offset-zinc-950"
    : "text-sm font-semibold text-zinc-700 transition hover:text-zinc-950 hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:ring-offset-4";
  const primaryButtonClassName = isDark
    ? "rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-4 focus:ring-offset-zinc-950"
    : "rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-4";

  function handleLogout() {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-token-changed"));
    router.push("/login");
  }

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-6 lg:px-8">
      <Link href="/" className={brandClassName}>
        AI Resume Optimizer
      </Link>

      <nav className={navClassName}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={navLinkClassName}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        {hasToken ? (
          <>
            <Link href="/dashboard" className={textButtonClassName}>
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={primaryButtonClassName}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={textButtonClassName}>
              Login
            </Link>
            <Link href="/signup" className={primaryButtonClassName}>
              Signup
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
