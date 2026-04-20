"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type AnalyzeResponse = {
  score: number;
  suggestions: string[];
};

type ApiErrorResponse = {
  detail?: string | { msg?: string }[];
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getApiErrorMessage(errorData: ApiErrorResponse, fallback: string) {
  if (typeof errorData.detail === "string") {
    return errorData.detail;
  }

  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((error) => error.msg)
      .filter(Boolean)
      .join(" ");
  }

  return fallback;
}

export default function UploadBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function resetProgress() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setUploadProgress(0);
  }

  function startUploadPreview() {
    resetProgress();

    progressTimerRef.current = window.setInterval(() => {
      setUploadProgress((currentProgress) => {
        if (currentProgress >= 100) {
          if (progressTimerRef.current) {
            window.clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
          }

          return 100;
        }

        return Math.min(currentProgress + 12, 100);
      });
    }, 180);
  }

  function validateAndSetFile(selectedFile?: File) {
    setError("");
    setResult(null);

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setFile(null);
      setIsAnalyzing(false);
      resetProgress();
      setError("Please upload a PDF resume only.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setIsAnalyzing(false);
      resetProgress();
      setError(`Please upload a PDF smaller than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setIsAnalyzing(false);
    setFile(selectedFile);
    startUploadPreview();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    validateAndSetFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files[0]);
  }

  function clearFile() {
    setFile(null);
    setError("");
    setResult(null);
    setIsAnalyzing(false);
    resetProgress();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleAnalyze() {
    if (!file || uploadProgress < 100 || isAnalyzing) {
      return;
    }

    setError("");
    setResult(null);
    setIsAnalyzing(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please log in before analyzing your resume.");
      }

      const requestBody = new FormData();
      requestBody.append("file", file);

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: requestBody,
      });

      if (!response.ok) {
        let message = "Unable to analyze resume. Please try again.";

        try {
          const errorData = (await response.json()) as ApiErrorResponse;
          message = getApiErrorMessage(errorData, message);
        } catch {
          message = `${message} Server returned ${response.status}.`;
        }

        throw new Error(message);
      }

      const data = (await response.json()) as AnalyzeResponse;
      setResult(data);
    } catch (uploadError) {
      if (uploadError instanceof TypeError) {
        setError(
          `Could not reach the backend at ${API_URL}. Make sure FastAPI is running.`,
        );
        return;
      }

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to upload resume. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full max-w-xl rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <label
        htmlFor="resume"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={
          isDragging
            ? "flex cursor-pointer flex-col items-center rounded-md border border-dashed border-emerald-500 bg-emerald-50 px-6 py-10 text-center transition-colors"
            : "flex cursor-pointer flex-col items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center transition-colors hover:border-zinc-400"
        }
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-lg font-semibold text-zinc-950 shadow-sm">
          PDF
        </span>
        <span className="mt-4 text-base font-semibold text-zinc-950">
          Drop your resume here
        </span>
        <span className="mt-2 text-sm leading-6 text-zinc-600">
          or click to browse. PDF only, up to {MAX_FILE_SIZE_MB} MB.
        </span>
        <input
          ref={inputRef}
          id="resume"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {file ? (
        <div className="mt-5 rounded-md border border-zinc-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-950">{file.name}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {formatFileSize(file.size)} PDF resume
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              disabled={isAnalyzing}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-zinc-700">
                {uploadProgress === 100 ? "Ready to analyze" : "Uploading"}
              </span>
              <span className="text-zinc-500">{uploadProgress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-md bg-zinc-100">
              <div
                className="h-2 rounded-md bg-emerald-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>

          {isAnalyzing ? (
            <div className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Analyzing...
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!file || uploadProgress < 100 || isAnalyzing}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isAnalyzing ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Analyzing...
          </>
        ) : (
          "Analyze Resume"
        )}
      </button>

      {result ? (
        <div className="mt-6 rounded-md border border-zinc-200 p-4">
          <p className="text-base font-semibold text-zinc-950">
            Score: {result.score}
          </p>
          <div className="mt-4">
            <p className="text-sm font-semibold text-zinc-700">Suggestions</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
              {result.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
