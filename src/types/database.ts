export interface Creator {
  id: string;
  name: string;
  platform: "tiktok" | "instagram" | "youtube";
  platform_handle: string | null;
  avatar_url: string | null;
  style_summary: string | null;
  videos_analyzed: number;
  common_hooks: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  video_count: number;
  parent_id: string | null;
  created_at: string;
}

export interface VideoAnalysis {
  hook: {
    type: string;
    first_3_seconds: string;
    text: string;
    template: string;
    effectiveness: number;
    effectiveness_reason: string;
  };
  visual_style: {
    primary_mode: string;
    secondary_mode: string | null;
    lighting: string;
    framing: string;
    text_overlays: string;
    production_level: string;
  };
  structure_pacing: {
    total_length_seconds: number;
    scene_changes: number;
    scene_pattern: string;
    pacing: string;
    rhythm_description: string;
  };
  content_technique: {
    explanation_style: string;
    tone: string;
    key_technique: string;
    tone_descriptors: string[];
  };
  cta: {
    type: string;
    placement: string;
    text: string;
  };
  suggested_category: string;
  suggested_tags: string[];
  key_takeaway: string;
}

export interface Video {
  id: string;
  url: string;
  platform: "tiktok" | "instagram" | "youtube";
  creator_id: string | null;
  title: string | null;
  description: string | null;
  duration: number | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  hashtags: string[] | null;
  transcript: string | null;
  word_count: number | null;
  thumbnail_url: string | null;
  analysis_json: VideoAnalysis | null;
  category_id: string | null;
  tags: string[] | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  creator?: Creator;
  category?: Category;
  frames?: Frame[];
}

export interface Frame {
  id: string;
  video_id: string;
  storage_path: string;
  public_url: string | null;
  timestamp_sec: number | null;
  frame_index: number | null;
  description: string | null;
  created_at: string;
}

export type JobStatus =
  | "queued"
  | "downloading"
  | "transcribing"
  | "extracting_frames"
  | "analyzing"
  | "complete"
  | "failed";

export interface Job {
  id: string;
  url: string;
  platform: string | null;
  status: JobStatus;
  progress: number;
  status_message: string | null;
  error_message: string | null;
  video_id: string | null;
  worker_started_at: string | null;
  worker_completed_at: string | null;
  created_at: string;
  updated_at: string;
}
