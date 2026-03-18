-- ============================================================
-- Creator Analyzer Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CREATORS ────────────────────────────────────────────────
CREATE TABLE creators (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    platform        TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
    platform_handle TEXT,
    avatar_url      TEXT,
    style_summary   TEXT,
    videos_analyzed INTEGER DEFAULT 0,
    common_hooks    TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, platform)
);

-- ── CATEGORIES ──────────────────────────────────────────────
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL UNIQUE,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT,
    color           TEXT DEFAULT '#c4f042',
    video_count     INTEGER DEFAULT 0,
    parent_id       UUID REFERENCES categories(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIDEOS ──────────────────────────────────────────────────
CREATE TABLE videos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url             TEXT NOT NULL UNIQUE,
    platform        TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
    creator_id      UUID REFERENCES creators(id),
    title           TEXT,
    description     TEXT,
    duration        REAL,
    view_count      BIGINT,
    like_count      BIGINT,
    comment_count   BIGINT,
    hashtags        TEXT[],
    transcript      TEXT,
    word_count      INTEGER,
    thumbnail_url   TEXT,
    analysis_json   JSONB,
    category_id     UUID REFERENCES categories(id),
    tags            TEXT[],
    analyzed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── FRAMES ──────────────────────────────────────────────────
CREATE TABLE frames (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id        UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    storage_path    TEXT NOT NULL,
    public_url      TEXT,
    timestamp_sec   REAL,
    frame_index     INTEGER,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── JOBS ─────────────────────────────────────────────────────
CREATE TABLE jobs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url             TEXT NOT NULL,
    platform        TEXT,
    status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN (
                        'queued', 'downloading', 'transcribing',
                        'extracting_frames', 'analyzing', 'complete', 'failed'
                    )),
    progress        INTEGER DEFAULT 0,
    status_message  TEXT,
    error_message   TEXT,
    video_id        UUID REFERENCES videos(id),
    worker_started_at   TIMESTAMPTZ,
    worker_completed_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_videos_platform ON videos(platform);
CREATE INDEX idx_videos_creator ON videos(creator_id);
CREATE INDEX idx_videos_category ON videos(category_id);
CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_videos_tags ON videos USING GIN(tags);
CREATE INDEX idx_videos_analysis ON videos USING GIN(analysis_json);
CREATE INDEX idx_frames_video ON frames(video_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_creators_platform ON creators(platform);

-- ── UPDATED_AT TRIGGERS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_videos
    BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_creators
    BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_jobs
    BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── ENABLE REALTIME ─────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
