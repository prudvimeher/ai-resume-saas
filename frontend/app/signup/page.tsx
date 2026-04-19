"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthForm from "@/components/AuthForm";

const SIGNUP_URL = "http://127.0.0.1:8000/signup";

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

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(email: string, password: string) {
    if (isLoading) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(SIGNUP_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let message = "Unable to create account. Please try again.";

        try {
          const errorData = (await response.json()) as ApiErrorResponse;
          message = getErrorMessage(errorData, message);
        } catch {
          message = `${message} Server returned ${response.status}.`;
        }

        throw new Error(message);
      }

      router.push("/login");
    } catch (signupError) {
      if (signupError instanceof TypeError) {
        setError(
          "Could not reach the backend. Make sure FastAPI is running at http://127.0.0.1:8000.",
        );
        return;
      }

      setError(
        signupError instanceof Error
          ? signupError.message
          : "Unable to create account. Please try again.",
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

      <div className="w-full max-w-[400px]">
        <AuthForm
          type="signup"
          title="Create account"
          subtitle="Start optimizing your resume"
          error={error}
          isLoading={isLoading}
          loadingLabel="Creating account..."
          onSubmit={handleSignup}
        />

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-neutral-950 transition hover:text-emerald-700"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
