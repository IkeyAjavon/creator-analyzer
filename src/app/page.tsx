"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UrlInput } from "@/components/UrlInput";
import { AnalysisStatus } from "@/components/AnalysisStatus";
import { AnalysisResult } from "@/components/AnalysisResult";
import { useRealtimeJob } from "@/lib/hooks/useRealtimeJob";
import type { Video } from "@/types/database";

export default function AnalyzePage() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedVideo, setCompletedVideo] = useState<Video | null>(null);
  const [submitError, setSubmitError] = useState("");
  const router = useRouter();

  const job = useRealtimeJob(jobId);

  // When job completes, fetch the full video data
  if (job?.status === "complete" && job.video_id && !completedVideo) {
    fetch(`/api/videos/${job.video_id}`)
      .then((r) => r.json())
      .then((video) => setCompletedVideo(video))
      .catch(() => {});
  }

  async function handleSubmit(url: string) {
    setIsSubmitting(true);
    setSubmitError("");
    setCompletedVideo(null);
    setJobId(null);

    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_analyzed" && data.videoId) {
          router.push(`/library/${data.videoId}`);
          return;
        }
        setSubmitError(data.error || "Failed to start analysis.");
        return;
      }

      setJobId(data.jobId);
    } catch {
      setSubmitError("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      <header className="mb-10">
        <div className="font-mono text-[10px] tracking-[3px] uppercase text-accent mb-5 md:hidden">
          Creator Analyzer
        </div>
        <h1 className="text-3xl sm:text-[40px] font-bold leading-[1.1] tracking-tight mb-4">
          Study any creator&apos;s
          <br />
          <span className="text-accent">content style</span>
        </h1>
        <p className="text-text-dim text-base leading-relaxed">
          Analyze videos, build a style library, and create content.
        </p>
      </header>

      <UrlInput onSubmit={handleSubmit} isLoading={isSubmitting} />

      {submitError && (
        <div className="bg-red/8 border border-red/20 rounded-2xl px-5 py-3.5 text-red text-sm mt-4">
          {submitError}
        </div>
      )}

      {job && job.status !== "complete" && (
        <div className="mt-6">
          <AnalysisStatus job={job} />
        </div>
      )}

      {completedVideo && (
        <div className="mt-6">
          <AnalysisResult video={completedVideo} />
        </div>
      )}
    </div>
  );
}
