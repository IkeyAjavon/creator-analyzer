"use client";

import type { Video, VideoAnalysis } from "@/types/database";
import { formatNumber, formatDuration } from "@/lib/utils/format";
import { FrameStrip } from "./FrameStrip";

interface AnalysisResultProps {
  video: Video;
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-sm font-bold text-accent">{score}/{max}</span>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  const bg = color || "var(--accent)";
  return (
    <span
      className="inline-block text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg"
      style={{
        background: `color-mix(in srgb, ${bg} 12%, transparent)`,
        color: bg,
        border: `1px solid color-mix(in srgb, ${bg} 25%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[20px] p-6 animate-fade-up">
      <h3 className="font-mono text-[10px] tracking-[3px] uppercase text-text-dim mb-5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border-subtle last:border-0">
      <span className="text-text-dim text-sm">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export function AnalysisResult({ video }: AnalysisResultProps) {
  const analysis = video.analysis_json as VideoAnalysis | null;
  if (!analysis) return null;

  return (
    <div className="space-y-4">
      {/* Header card with stats */}
      <div className="bg-surface border border-border-subtle rounded-[20px] p-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {video.creator?.name || "Unknown"} — {video.title || "Video"}
            </h2>
          </div>
          <Badge>{video.platform}</Badge>
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {video.duration != null && (
            <div className="stat-card">
              <span className="stat-value">{formatDuration(video.duration)}</span>
              <span className="stat-label">Duration</span>
            </div>
          )}
          {video.view_count != null && (
            <div className="stat-card">
              <span className="stat-value">{formatNumber(video.view_count)}</span>
              <span className="stat-label">Views</span>
            </div>
          )}
          {video.like_count != null && (
            <div className="stat-card">
              <span className="stat-value">{formatNumber(video.like_count)}</span>
              <span className="stat-label">Likes</span>
            </div>
          )}
        </div>

        {/* Frames strip */}
        {video.frames && video.frames.length > 0 && (
          <FrameStrip frames={video.frames} />
        )}
      </div>

      {/* Hook Analysis */}
      <SectionCard title="Hook Analysis">
        <div className="flex items-center gap-2 mb-4">
          <Badge color="var(--accent)">{analysis.hook.type.replace(/_/g, " ")}</Badge>
        </div>
        <p className="text-sm leading-relaxed mb-4">
          <span className="text-text-dim">First 3 seconds: </span>
          {analysis.hook.first_3_seconds}
        </p>
        {analysis.hook.text && (
          <div className="bg-surface-2 rounded-2xl p-4 mb-4">
            <p className="text-sm italic leading-relaxed">&ldquo;{analysis.hook.text}&rdquo;</p>
          </div>
        )}
        {analysis.hook.template && (
          <p className="text-sm text-accent-dim mb-4">
            <span className="text-text-dim">Template: </span>
            {analysis.hook.template}
          </p>
        )}
        <div className="mt-2">
          <ScoreBar score={analysis.hook.effectiveness} />
          <p className="text-xs text-text-dim mt-2">{analysis.hook.effectiveness_reason}</p>
        </div>
      </SectionCard>

      {/* Visual Style */}
      <SectionCard title="Visual Style">
        <DetailRow label="Primary Mode" value={analysis.visual_style.primary_mode.replace(/_/g, " ")} />
        {analysis.visual_style.secondary_mode && (
          <DetailRow label="Secondary Mode" value={analysis.visual_style.secondary_mode.replace(/_/g, " ")} />
        )}
        <DetailRow label="Lighting" value={analysis.visual_style.lighting} />
        <DetailRow label="Framing" value={analysis.visual_style.framing} />
        <DetailRow label="Production" value={
          <Badge color={
            analysis.visual_style.production_level === "high" ? "var(--blue)" :
            analysis.visual_style.production_level === "medium" ? "var(--orange)" : "#8a8a95"
          }>
            {analysis.visual_style.production_level}
          </Badge>
        } />
        {analysis.visual_style.text_overlays && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-xs text-text-dim mb-1">Text Overlays</p>
            <p className="text-sm leading-relaxed">{analysis.visual_style.text_overlays}</p>
          </div>
        )}
      </SectionCard>

      {/* Structure & Pacing */}
      <SectionCard title="Structure & Pacing">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="stat-card">
            <span className="stat-value">{analysis.structure_pacing.total_length_seconds}<span className="stat-unit">s</span></span>
            <span className="stat-label">Length</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{analysis.structure_pacing.scene_changes}</span>
            <span className="stat-label">Scene Changes</span>
          </div>
          <div className="stat-card items-center">
            <Badge color={
              analysis.structure_pacing.pacing === "fast" ? "var(--red)" :
              analysis.structure_pacing.pacing === "slow" ? "var(--blue)" : "var(--orange)"
            }>
              {analysis.structure_pacing.pacing}
            </Badge>
            <span className="stat-label">Pacing</span>
          </div>
        </div>
        {analysis.structure_pacing.scene_pattern && (
          <div className="mb-3">
            <p className="text-xs text-text-dim mb-1">Scene Pattern</p>
            <p className="text-sm leading-relaxed">{analysis.structure_pacing.scene_pattern}</p>
          </div>
        )}
        {analysis.structure_pacing.rhythm_description && (
          <div>
            <p className="text-xs text-text-dim mb-1">Rhythm</p>
            <p className="text-sm leading-relaxed">{analysis.structure_pacing.rhythm_description}</p>
          </div>
        )}
      </SectionCard>

      {/* Content Technique */}
      <SectionCard title="Content Technique">
        <DetailRow label="Explanation Style" value={analysis.content_technique.explanation_style.replace(/_/g, " ")} />
        <DetailRow label="Tone" value={analysis.content_technique.tone} />
        <div className="flex gap-1.5 flex-wrap mt-4 mb-4">
          {analysis.content_technique.tone_descriptors?.map((d, i) => (
            <span key={i} className="text-xs bg-surface-2 border border-border-subtle rounded-lg px-2.5 py-1 text-text-dim">
              {d}
            </span>
          ))}
        </div>
        <div className="bg-surface-2 rounded-2xl p-4">
          <p className="text-xs text-text-dim mb-1">Key Technique</p>
          <p className="text-sm font-medium leading-relaxed">{analysis.content_technique.key_technique}</p>
        </div>
      </SectionCard>

      {/* CTA */}
      {analysis.cta.type !== "none" && (
        <SectionCard title="Call to Action">
          <DetailRow label="Type" value={analysis.cta.type} />
          <DetailRow label="Placement" value={analysis.cta.placement} />
          {analysis.cta.text && (
            <div className="bg-surface-2 rounded-2xl p-4 mt-4">
              <p className="text-sm italic leading-relaxed">&ldquo;{analysis.cta.text}&rdquo;</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Key Takeaway */}
      <div className="bg-accent/8 border border-accent/15 rounded-[20px] p-6 animate-fade-up">
        <h3 className="font-mono text-[10px] tracking-[3px] uppercase text-accent mb-3">
          Key Takeaway
        </h3>
        <p className="text-sm leading-relaxed">{analysis.key_takeaway}</p>
      </div>

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {video.tags.map((tag, i) => (
            <span key={i} className="text-xs bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-text-dim">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
