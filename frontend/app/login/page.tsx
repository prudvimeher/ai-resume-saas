"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthForm from "@/components/AuthForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const LOGIN_URL = `${API_URL}/login`;

type LoginResponse = {
  access_token?: string;
};

type ApiErrorResponse = {
  detail?: string | { msg?: string }[];
};

function getErrorMessage(errorData: ApiErrorResponse, fallback: string) {
  if (typeof errorData.detail === "string") {
    return errorData.detail;
  }

  if (Array.isArray(errorData.detail)) {
    const message = errorData.detail
      .map((error) => error.msg)
      .filter(Boolean)
      .join(" ");

    return message || fallback;
  }

  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(email: string, password: string) {
    if (isLoading) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let message = "Unable to log in. Please try again.";

        try {
          const errorData = (await response.json()) as ApiErrorResponse;
          message = getErrorMessage(errorData, message);
        } catch {
          message = `${message} Server returned ${response.status}.`;
        }

        throw new Error(message);
      }

      const data = (await response.json()) as LoginResponse;

      if (!data.access_token) {
        throw new Error("Login response did not include a token.");
      }

      localStorage.setItem("token", data.access_token);
      window.dispatchEvent(new Event("auth-token-changed"));
      router.push("/dashboard");
    } catch (loginError) {
      if (loginError instanceof TypeError) {
        setError(
          `Could not reach the backend at ${API_URL}. Make sure FastAPI is running.`,
        );
        return;
      }

      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to log in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12 text-neutral-950">
      <Link
        href="/"
        className="absolute left-4 top-4 text-sm font-medium text-neutral-600 transition hover:text-neutral-950 hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-950/20 focus:ring-offset-4 sm:left-6 sm:top-6"
        aria-label="Back to homepage"
      >
        AI Resume Optimizer
      </Link>

      <div className="w-full max-w-100">
        <AuthForm
          type="login"
          title="Welcome back"
          subtitle="Login to your account"
          error={error}
          isLoading={isLoading}
          loadingLabel="Logging in..."
          onSubmit={handleLogin}
        />

        <p className="mt-6 text-center text-sm text-neutral-500">
          New here?{" "}
          <Link
            href="/signup"
            className="font-semibold text-neutral-950 transition hover:text-emerald-700"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
