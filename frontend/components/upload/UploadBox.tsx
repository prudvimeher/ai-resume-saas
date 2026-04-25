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
  const [jdMode, setJdMode] = useState<"none" | "text" | "file">("none");
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

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

  function clearJd() {
    setJdText("");
    setJdFile(null);
    if (jdInputRef.current) jdInputRef.current.value = "";
  }

  function clearFile() {
    setFile(null);
    setError("");
    setResult(null);
    setIsAnalyzing(false);
    resetProgress();
    clearJd();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleJdFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const name = selected.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setError("Job description must be a PDF or DOCX file.");
      setJdFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`Job description file must be smaller than ${MAX_FILE_SIZE_MB} MB.`);
      setJdFile(null);
      return;
    }

    setError("");
    setJdFile(selected);
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
      if (jdMode === "text" && jdText.trim()) {
        requestBody.append("job_description_text", jdText.trim());
      }
      if (jdMode === "file" && jdFile) {
        requestBody.append("job_description_file", jdFile);
      }

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

      {/* Job Description Section */}
      <div className="mt-6">
        <p className="text-sm font-semibold text-zinc-950 mb-3">
          Job Description{" "}
          <span className="font-normal text-zinc-400">(optional)</span>
        </p>

        {/* Mode selector tabs */}
        <div className="flex gap-2 mb-4">
          {(["none", "text", "file"] as const).map((mode) => {
            const labels = { none: "Skip", text: "Paste Text", file: "Upload File" };
            const isActive = jdMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setJdMode(mode);
                  clearJd();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-1 ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {/* Text input */}
        {jdMode === "text" && (
          <div className="relative">
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job description here…"
              rows={5}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition-colors focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-1 resize-none"
            />
            {jdText && (
              <button
                type="button"
                onClick={() => setJdText("")}
                className="absolute top-2 right-2 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* File input */}
        {jdMode === "file" && (
          <div>
            {!jdFile ? (
              <label
                htmlFor="jd-file"
                className="flex cursor-pointer flex-col items-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-6 py-6 text-center transition-colors hover:border-zinc-400 hover:bg-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-xs font-semibold text-zinc-950 shadow-sm border border-zinc-100">
                  JD
                </span>
                <span className="mt-3 text-sm font-medium text-zinc-700">
                  Drop job description here
                </span>
                <span className="mt-1 text-xs text-zinc-400">
                  PDF or DOCX, up to {MAX_FILE_SIZE_MB} MB
                </span>
                <input
                  ref={jdInputRef}
                  id="jd-file"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleJdFileChange}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-950">{jdFile.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {formatFileSize(jdFile.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setJdFile(null);
                    if (jdInputRef.current) jdInputRef.current.value = "";
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors px-2 py-1 rounded hover:bg-zinc-100"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
        <div className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          {/* Score row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-950">ATS Score</p>
            <span
              className={`text-2xl font-bold tabular-nums ${
                result.score >= 75
                  ? "text-emerald-600"
                  : result.score >= 50
                    ? "text-amber-500"
                    : "text-red-500"
              }`}
            >
              {result.score}
              <span className="text-sm font-normal text-zinc-400">/100</span>
            </span>
          </div>

          {/* Score bar */}
          <div className="h-1.5 rounded-full bg-zinc-100 mb-5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                result.score >= 75
                  ? "bg-emerald-500"
                  : result.score >= 50
                    ? "bg-amber-400"
                    : "bg-red-400"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>

          {/* Suggestions */}
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-3">
            Insights
          </p>
          <ul className="space-y-2">
            {result.suggestions.map((suggestion, i) => (
              <li key={i} className="flex gap-3 text-sm text-zinc-700 leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
                  {i + 1}
                </span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
