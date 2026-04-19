"use client";

import { FormEvent, useState } from "react";

type AuthFormProps = {
  type: "login" | "signup";
  title?: string;
  subtitle?: string;
  error?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  onSubmit: (email: string, password: string) => void;
};

const formCopy = {
  login: {
    eyebrow: "Welcome back",
    title: "Log in",
    subtitle: "Continue to your resume workspace.",
    passwordAutocomplete: "current-password",
    passwordPlaceholder: "Enter your password",
    submitLabel: "Log in",
  },
  signup: {
    eyebrow: "Start fresh",
    title: "Sign up",
    subtitle: "Create your workspace and shape your next resume.",
    passwordAutocomplete: "new-password",
    passwordPlaceholder: "Create a password",
    submitLabel: "Create account",
  },
} as const;

export default function AuthForm({
  type,
  title,
  subtitle,
  error,
  isLoading = false,
  loadingLabel,
  onSubmit,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const copy = formCopy[type];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(email, password);
  }

  return (
    <section className="w-full max-w-[400px] rounded-xl border border-neutral-200 bg-white p-8 text-neutral-950 shadow-md shadow-neutral-950/5">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-emerald-700">{copy.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">
          {title ?? copy.title}
        </h1>
        <p className="text-sm leading-6 text-neutral-500">
          {subtitle ?? copy.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor={`${type}-email`}
            className="block text-sm font-medium leading-5 text-neutral-700"
          >
            Email
          </label>
          <input
            id={`${type}-email`}
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isLoading}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${type}-error` : undefined}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10 focus-visible:border-neutral-950 focus-visible:ring-4 focus-visible:ring-neutral-950/10 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:placeholder:text-neutral-300"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`${type}-password`}
            className="block text-sm font-medium leading-5 text-neutral-700"
          >
            Password
          </label>
          <input
            id={`${type}-password`}
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={copy.passwordAutocomplete}
            placeholder={copy.passwordPlaceholder}
            disabled={isLoading}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${type}-error` : undefined}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10 focus-visible:border-neutral-950 focus-visible:ring-4 focus-visible:ring-neutral-950/10 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:placeholder:text-neutral-300"
          />
        </div>

        {error ? (
          <p
            id={`${type}-error`}
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full overflow-hidden rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-neutral-800 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-950/20 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-100 disabled:shadow-none"
        >
          <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0 group-active:translate-x-0" />
          <span className="relative">
            {isLoading ? (loadingLabel ?? "Please wait...") : copy.submitLabel}
          </span>
        </button>
      </form>
    </section>
  );
}
