"use client";

import type { Frame } from "@/types/database";

interface FrameStripProps {
  frames: Frame[];
  size?: "sm" | "md" | "lg";
}

export function FrameStrip({ frames, size = "sm" }: FrameStripProps) {
  const heights = { sm: "h-20", md: "h-32", lg: "h-48" };
  const h = heights[size];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
      {frames
        .sort((a, b) => (a.frame_index || 0) - (b.frame_index || 0))
        .map((frame) => (
          <img
            key={frame.id}
            src={frame.public_url || ""}
            alt={`Frame ${frame.frame_index}`}
            className={`${h} rounded-xl border border-border-subtle flex-shrink-0 object-cover`}
          />
        ))}
    </div>
  );
}
