"use client";

import type { Job } from "@/types/database";

const STATUS_STEPS = [
  { key: "queued", label: "Queued" },
  { key: "downloading", label: "Downloading" },
  { key: "transcribing", label: "Transcribing" },
  { key: "extracting_frames", label: "Extracting frames" },
  { key: "analyzing", label: "Analyzing" },
  { key: "complete", label: "Complete" },
];

interface AnalysisStatusProps {
  job: Job;
}

export function AnalysisStatus({ job }: AnalysisStatusProps) {
  const isComplete = job.status === "complete";
  const isFailed = job.status === "failed";
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === job.status);

  return (
    <div className="bg-surface border border-border-subtle rounded-[20px] p-6 animate-fade-up">
      {/* Status header */}
      <div className="flex items-center gap-3 mb-5">
        {!isComplete && !isFailed && (
          <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {isComplete && (
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
            ✓
          </div>
        )}
        {isFailed && (
          <div className="w-8 h-8 rounded-full bg-red/10 border border-red/20 flex items-center justify-center text-red text-sm font-bold">
            ✕
          </div>
        )}
        <div>
          <p className="font-medium text-[15px]">
            {job.status_message ||
              STATUS_STEPS.find((s) => s.key === job.status)?.label ||
              "Processing..."}
          </p>
          {!isComplete && !isFailed && (
            <p className="text-xs text-text-dim mt-0.5">This may take a moment</p>
          )}
        </div>
      </div>

      {/* Step indicators */}
      {!isFailed && (
        <div className="flex gap-1.5">
          {STATUS_STEPS.slice(0, -1).map((step, i) => (
            <div
              key={step.key}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i < currentIndex
                  ? "bg-accent"
                  : i === currentIndex
                  ? "bg-accent/50"
                  : "bg-surface-2"
              }`}
            />
          ))}
        </div>
      )}

      {isFailed && job.error_message && (
        <div className="bg-red/8 border border-red/20 rounded-2xl px-4 py-3 text-red text-sm mt-1">
          {job.error_message}
        </div>
      )}
    </div>
  );
}
