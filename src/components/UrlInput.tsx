"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { detectPlatform, isValidVideoUrl } from "@/lib/utils/url";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const platform = url ? detectPlatform(url) : null;

  function handleSubmit() {
    setError("");
    if (!url.trim()) {
      setError("Please paste a video URL first.");
      return;
    }
    if (!isValidVideoUrl(url)) {
      setError("Please use a TikTok, Instagram Reel, or YouTube URL.");
      return;
    }
    onSubmit(url.trim());
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-[20px] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSubmit()}
            placeholder="Paste a TikTok or Instagram Reel URL..."
            className="w-full bg-bg border border-border rounded-xl px-5 py-4 text-[15px] outline-none transition-colors focus:border-accent placeholder:text-text-dim/40"
            autoComplete="off"
            spellCheck={false}
            disabled={isLoading}
          />
          {platform && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[2px] uppercase bg-accent/15 text-accent px-2.5 py-1 rounded-lg border border-accent/20">
              {platform}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-accent text-white rounded-xl px-8 py-4 text-[15px] font-bold transition-all hover:shadow-[0_4px_24px_rgba(62,136,160,0.25)] active:scale-[0.97] disabled:opacity-40 disabled:shadow-none whitespace-nowrap flex items-center justify-center gap-2 flex-shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red/8 border border-red/20 rounded-xl px-5 py-3.5 text-red text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
