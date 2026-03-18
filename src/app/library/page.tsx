"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter } from "lucide-react";
import type { Video, Category } from "@/types/database";
import { formatNumber, formatDuration, timeAgo } from "@/lib/utils/format";

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadVideos();
    loadCategories();
  }, [platformFilter, categoryFilter]);

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch { /* ignore */ }
  }

  async function loadVideos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (platformFilter) params.set("platform", platformFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/videos?${params}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function handleSearch() {
    loadVideos();
  }

  const filteredVideos = videos;

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Library</h1>
        <p className="text-text-dim text-sm">
          {videos.length} video{videos.length !== 1 ? "s" : ""} analyzed
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search videos..."
            className="w-full bg-surface border border-border-subtle rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-accent/40 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-surface border border-border-subtle rounded-2xl px-4 py-3 text-sm outline-none text-text"
          >
            <option value="">All Platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border-subtle rounded-2xl px-4 py-3 text-sm outline-none text-text"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-border-subtle rounded-[20px] p-4 animate-pulse">
              <div className="h-24 bg-surface-2 rounded-xl mb-3" />
              <div className="h-4 bg-surface-2 rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-2 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-20">
          <Filter size={36} className="mx-auto text-text-dim mb-4 opacity-20" />
          <p className="text-text-dim text-sm">No videos found. Analyze your first video from the home page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <Link
              key={video.id}
              href={`/library/${video.id}`}
              className="bg-surface border border-border-subtle rounded-[20px] p-4 hover:border-accent/20 transition-all group"
            >
              {/* Thumbnail */}
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title || ""}
                  className="w-full h-28 object-cover rounded-xl mb-3"
                />
              ) : (
                <div className="w-full h-28 bg-surface-2 rounded-xl mb-3 flex items-center justify-center text-text-dim/30 text-xs">
                  No thumbnail
                </div>
              )}

              {/* Info */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-accent transition-colors">
                  {video.title || "Untitled"}
                </h3>
                <span className="font-mono text-[8px] tracking-[1px] uppercase bg-accent/12 text-accent px-1.5 py-0.5 rounded-md flex-shrink-0 border border-accent/15">
                  {video.platform}
                </span>
              </div>

              <p className="text-xs text-text-dim mb-2">
                {video.creator?.name || "Unknown"} {video.duration ? `· ${formatDuration(video.duration)}` : ""}
              </p>

              <div className="flex gap-3 text-xs text-text-dim/60">
                {video.view_count != null && <span>{formatNumber(video.view_count)} views</span>}
                <span>{timeAgo(video.created_at)}</span>
              </div>

              {/* Category badge */}
              {video.category && (
                <div className="mt-3">
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-lg"
                    style={{
                      background: `${video.category.color}15`,
                      color: video.category.color,
                      border: `1px solid ${video.category.color}25`,
                    }}
                  >
                    {video.category.name}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
