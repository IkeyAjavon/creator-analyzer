"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Creator, Video } from "@/types/database";
import { formatNumber, formatDuration, timeAgo } from "@/lib/utils/format";

export default function CreatorDetailPage() {
  const params = useParams();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    Promise.all([
      fetch(`/api/creators`).then((r) => r.json()),
      fetch(`/api/videos?creator=${params.id}`).then((r) => r.json()),
    ])
      .then(([creatorsData, videosData]) => {
        const found = (creatorsData.creators || []).find(
          (c: Creator) => c.id === params.id
        );
        setCreator(found || null);
        setVideos(videosData.videos || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-surface-2 rounded w-28" />
          <div className="h-32 bg-surface rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20 text-center">
        <p className="text-text-dim">Creator not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      <Link
        href="/creators"
        className="flex items-center gap-2 text-text-dim text-sm hover:text-text transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Creators
      </Link>

      {/* Profile card */}
      <div className="bg-surface border border-border-subtle rounded-[20px] p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-bold tracking-tight">{creator.name}</h1>
          <span className="font-mono text-[9px] tracking-[1px] uppercase bg-accent/12 text-accent px-2.5 py-1 rounded-lg border border-accent/15">
            {creator.platform}
          </span>
        </div>

        <div className="flex gap-3 text-sm text-text-dim mb-4">
          {creator.platform_handle && <span>@{creator.platform_handle}</span>}
          <span>{creator.videos_analyzed} videos analyzed</span>
        </div>

        {creator.style_summary && (
          <p className="text-sm text-text-dim leading-relaxed mb-4">
            {creator.style_summary}
          </p>
        )}

        {creator.common_hooks && creator.common_hooks.length > 0 && (
          <div>
            <p className="text-xs text-text-dim/60 mb-2">Common Hook Types</p>
            <div className="flex gap-1.5 flex-wrap">
              {creator.common_hooks.map((hook, i) => (
                <span key={i} className="text-xs bg-accent/8 text-accent border border-accent/15 rounded-lg px-2.5 py-1">
                  {hook.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Videos by this creator */}
      <h2 className="font-mono text-[10px] tracking-[3px] uppercase text-text-dim mb-4">
        Analyzed Videos
      </h2>

      {videos.length === 0 ? (
        <p className="text-text-dim text-sm">No videos analyzed yet.</p>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/library/${video.id}`}
              className="flex items-center justify-between bg-surface border border-border-subtle rounded-[20px] p-4 hover:border-accent/20 transition-all group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="w-16 h-10 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-10 bg-surface-2 rounded-xl flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-medium group-hover:text-accent transition-colors line-clamp-1">
                    {video.title || "Untitled"}
                  </h3>
                  <div className="flex gap-3 text-xs text-text-dim/60 mt-1">
                    {video.duration && <span>{formatDuration(video.duration)}</span>}
                    {video.view_count != null && <span>{formatNumber(video.view_count)} views</span>}
                    <span>{timeAgo(video.created_at)}</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-dim/30 group-hover:text-accent transition-colors flex-shrink-0 ml-2" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
