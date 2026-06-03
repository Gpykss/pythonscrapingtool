"use client";

import { useState, FormEvent } from "react";

interface ScrapedStats {
  url: string;
  rowCount: number;
  fileSize: string;
  timestamp: string;
}

export default function Home() {
  const [targetUrl, setTargetUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastScraped, setLastScraped] = useState<ScrapedStats | null>(null);

  const handleHarvest = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    try {
      // Validate URL format roughly on frontend
      let formattedUrl = targetUrl.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const response = await fetch("/api/harvest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_url: formattedUrl }),
      });

      if (!response.ok) {
        let errorText = "Harvesting failed.";
        try {
          const errData = await response.json();
          errorText = errData.detail || errorText;
        } catch {
          errorText = `Target returned HTTP status ${response.status}`;
        }
        throw new Error(errorText);
      }

      const blob = await response.blob();
      const csvText = await blob.text();
      
      // Calculate row count from CSV lines
      const rows = csvText.split("\n").filter((line) => line.trim().length > 0);
      const rowCount = rows.length;
      
      // Calculate human readable file size
      const sizeInKb = (blob.size / 1024).toFixed(2);
      const fileSizeStr = `${sizeInKb} KB`;

      // Trigger browser file download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gpykss_harvest_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setLastScraped({
        url: formattedUrl,
        rowCount,
        fileSize: fileSizeStr,
        timestamp: new Date().toLocaleTimeString(),
      });
      setTargetUrl("");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during harvesting.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-grid min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-slide-up">
      {/* Engine Status Top Bar */}
      <div className="mb-6 flex justify-center w-full max-w-xl">
        <div className="status-badge">
          <span className="status-badge-dot"></span>
          <span>HARVEST ENGINE: ONLINE</span>
        </div>
      </div>

      {/* Main Harvester Card */}
      <div className="harvester-card w-full max-w-xl">
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <svg
              className="w-6 h-6 text-[#00ffa3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.58 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.58 4 8 4s8-1.79 8-4M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4m0 5c0 2.21-3.58 4-8 4s-8-1.79-8-4"
              />
            </svg>
            Gpykss Harvester
          </h1>
          <p className="text-zinc-500 text-sm">
            Extract unstructured tables & directories into clean matrix CSV sheets
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleHarvest} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Target Directory URL
            </label>
            <input
              type="text"
              className="harvester-input"
              placeholder="e.g. https://example.com/directory"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className={`harvester-btn ${
              isLoading ? "harvester-btn-loading" : "harvester-btn-idle"
            } mt-2 flex items-center justify-center gap-2`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin-arc"></span>
                Scraping and Building Matrix...
              </>
            ) : (
              "Run Harvest Operation"
            )}
          </button>
        </form>

        {/* Feedback Banners */}
        {(errorMsg || success) && <div className="mt-6 flex flex-col gap-4"></div>}

        {errorMsg && (
          <div className="error-banner animate-error-slide mt-6">
            <svg
              className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <span className="font-semibold block text-red-300">Extraction Error</span>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="success-banner mt-6">
            <svg
              className="w-5 h-5 text-[#00ffa3] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>CSV Matrix successfully generated and downloaded!</span>
          </div>
        )}

        {/* Stats Divider */}
        <div className="harvester-divider"></div>

        {/* Last Run Stats */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Last Operation Log
          </h3>
          {lastScraped ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="stat-chip col-span-2 sm:col-span-3">
                <span className="stat-chip-label">Target URL</span>
                <span className="stat-chip-value truncate block" title={lastScraped.url}>
                  {lastScraped.url}
                </span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-label">Rows Harvested</span>
                <span className="stat-chip-value text-[#00ffa3]">{lastScraped.rowCount} rows</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-label">File Size</span>
                <span className="stat-chip-value">{lastScraped.fileSize}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-chip-label">Completed At</span>
                <span className="stat-chip-value">{lastScraped.timestamp}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">No operations performed in this session.</p>
          )}
        </div>
      </div>
    </div>
  );
}
