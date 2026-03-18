"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";
import type { Creator } from "@/types/database";

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/creators")
      .then((r) => r.json())
      .then((data) => setCreators(data.creators || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Creators</h1>
        <p className="text-text-dim text-sm">
          Profiles of creators you&apos;ve studied
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface border border-border-subtle rounded-[20px] p-5 animate-pulse">
              <div className="h-5 bg-surface-2 rounded w-40 mb-3" />
              <div className="h-3 bg-surface-2 rounded w-60" />
            </div>
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-20">
          <Users size={36} className="mx-auto text-text-dim mb-4 opacity-20" />
          <p className="text-text-dim text-sm">
            No creators yet. Analyze some videos to start building profiles.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              href={`/creators/${creator.id}`}
              className="flex items-center justify-between bg-surface border border-border-subtle rounded-[20px] p-5 hover:border-accent/20 transition-all group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium group-hover:text-accent transition-colors">
                    {creator.name}
                  </h3>
                  <span className="font-mono text-[9px] tracking-[1px] uppercase bg-surface-2 px-2 py-0.5 rounded-md text-text-dim">
                    {creator.platform}
                  </span>
                </div>
                <p className="text-sm text-text-dim">
                  {creator.videos_analyzed} video{creator.videos_analyzed !== 1 ? "s" : ""} analyzed
                </p>
                {creator.common_hooks && creator.common_hooks.length > 0 && (
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {creator.common_hooks.map((hook, i) => (
                      <span key={i} className="text-[10px] bg-accent/8 text-accent border border-accent/15 rounded-lg px-2.5 py-1">
                        {hook.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight size={18} className="text-text-dim/30 group-hover:text-accent transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
