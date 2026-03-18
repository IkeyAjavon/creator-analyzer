"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AnalysisResult } from "@/components/AnalysisResult";
import type { Video } from "@/types/database";

export default function VideoDetailPage() {
  const params = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/videos/${params.id}`)
        .then((r) => r.json())
        .then((data) => {
          setVideo(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-surface-2 rounded w-28" />
          <div className="h-40 bg-surface rounded-[20px]" />
          <div className="h-60 bg-surface rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20 text-center">
        <p className="text-text-dim mb-3">Video not found.</p>
        <Link href="/library" className="text-accent text-sm hover:underline">
          Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      {/* Back button + external link */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/library"
          className="flex items-center gap-2 text-text-dim text-sm hover:text-text transition-colors"
        >
          <ArrowLeft size={16} />
          Library
        </Link>
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-accent text-sm hover:underline"
        >
          View Original
          <ExternalLink size={14} />
        </a>
      </div>

      <AnalysisResult video={video} />

      {/* Transcript */}
      {video.transcript && (
        <div className="mt-4 bg-surface border border-border-subtle rounded-[20px] p-6">
          <h3 className="font-mono text-[10px] tracking-[3px] uppercase text-text-dim mb-4">
            Full Transcript
          </h3>
          <p className="text-sm leading-relaxed text-text-dim whitespace-pre-wrap">
            {video.transcript}
          </p>
        </div>
      )}
    </div>
  );
}
