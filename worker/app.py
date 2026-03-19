"""Creator Analyzer Worker — Flask API for video processing."""

import logging
import os
import shutil
import tempfile
import threading
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

from config import WORKER_SECRET, DEFAULT_FRAMES
from downloader import detect_platform, get_video_metadata, download_video, get_youtube_captions, safe_filename
from transcriber import transcribe_video
from frame_extractor import extract_frames
from analyzer import analyze_video
from storage import get_supabase, upload_frame, update_job_status

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.utcnow().isoformat()})


@app.route("/process", methods=["POST"])
def process():
    """Process a video analysis job. Runs the full pipeline."""
    # Auth check
    auth = request.headers.get("Authorization", "")
    if WORKER_SECRET and auth != f"Bearer {WORKER_SECRET}":
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    job_id = data.get("job_id")
    url = data.get("url")

    if not job_id or not url:
        return jsonify({"error": "Missing job_id or url"}), 400

    # Run processing in background thread so we can return 202 immediately
    thread = threading.Thread(target=run_pipeline, args=(job_id, url), daemon=True)
    thread.start()

    return jsonify({"status": "processing", "job_id": job_id}), 202


def run_pipeline(job_id: str, url: str):
    """Full video processing pipeline."""
    work_dir = Path(tempfile.mkdtemp(prefix="creator_"))

    try:
        platform = detect_platform(url)
        supabase = get_supabase()

        # ── Step 1: Download ─────────────────────────────────────
        update_job_status(job_id, "downloading", 5, "Downloading video...")

        meta = get_video_metadata(url)
        meta["_platform"] = platform

        video_path = download_video(url, work_dir)
        if not video_path:
            update_job_status(job_id, "failed", 0, error="Download failed. URL may be private or region-locked.")
            return

        update_job_status(job_id, "downloading", 20, f"Downloaded: {meta.get('title', 'video')[:50]}")

        # ── Step 2: Transcribe ──────────────────────────────────────
        update_job_status(job_id, "transcribing", 30, "Transcribing audio...")

        transcript = None

        # Try YouTube captions first (free, no API needed)
        if platform == "youtube":
            transcript = get_youtube_captions(url, work_dir)

        # If no captions, use Groq Whisper to transcribe the audio
        if not transcript:
            transcript = transcribe_video(video_path, work_dir)

        if not transcript:
            transcript = "[No transcript available — Claude will analyze from frames only]"

        word_count = len(transcript.split())
        update_job_status(job_id, "transcribing", 50, f"Transcript: {word_count} words")

        # ── Step 3: Extract frames ───────────────────────────────
        update_job_status(job_id, "extracting_frames", 60, f"Extracting {DEFAULT_FRAMES} keyframes...")

        frame_paths = extract_frames(video_path, work_dir, DEFAULT_FRAMES)
        update_job_status(job_id, "extracting_frames", 70, f"Extracted {len(frame_paths)} frames")

        # ── Step 4: Analyze with Claude ──────────────────────────
        update_job_status(job_id, "analyzing", 75, "Analyzing with Claude...")

        # Get previous analyses for this creator (for context)
        creator_name = meta.get("uploader", meta.get("channel", "Unknown"))
        previous_context = ""
        try:
            prev_result = supabase.table("videos").select("title, analysis_json").execute()
            prev_videos = [
                v for v in (prev_result.data or [])
                if v.get("analysis_json")
            ]
            # Look for same creator by checking existing creator records
            creator_result = supabase.table("creators").select("id").eq("name", creator_name).eq("platform", platform).execute()
            if creator_result.data:
                creator_id = creator_result.data[0]["id"]
                prev_by_creator = supabase.table("videos").select("title, analysis_json").eq("creator_id", creator_id).limit(3).execute()
                if prev_by_creator.data:
                    for v in prev_by_creator.data:
                        a = v.get("analysis_json", {})
                        if a:
                            previous_context += f"\n- {v.get('title', 'Unknown')}: {a.get('key_takeaway', 'No summary')[:100]}"
        except Exception:
            pass

        analysis = analyze_video(frame_paths, meta, transcript, previous_context)

        if not analysis:
            update_job_status(job_id, "failed", 0, error="Claude analysis returned invalid JSON.")
            return

        update_job_status(job_id, "analyzing", 90, "Saving results...")

        # ── Step 5: Save to Supabase ─────────────────────────────

        # Upsert creator
        creator_data = {
            "name": creator_name,
            "platform": platform,
            "platform_handle": meta.get("uploader_id", meta.get("channel_id")),
        }
        creator_result = supabase.table("creators").upsert(
            creator_data, on_conflict="name,platform"
        ).execute()
        creator_id = creator_result.data[0]["id"] if creator_result.data else None

        # Match category
        category_id = None
        suggested_cat = analysis.get("suggested_category", "")
        if suggested_cat:
            cat_result = supabase.table("categories").select("id").ilike("name", f"%{suggested_cat}%").limit(1).execute()
            if cat_result.data:
                category_id = cat_result.data[0]["id"]

        # Insert video
        video_data = {
            "url": url,
            "platform": platform,
            "creator_id": creator_id,
            "title": meta.get("title", "Untitled")[:200],
            "description": (meta.get("description") or "")[:2000],
            "duration": meta.get("duration"),
            "view_count": meta.get("view_count"),
            "like_count": meta.get("like_count"),
            "comment_count": meta.get("comment_count"),
            "hashtags": meta.get("tags", [])[:20],
            "transcript": transcript,
            "word_count": word_count,
            "analysis_json": analysis,
            "category_id": category_id,
            "tags": analysis.get("suggested_tags", []),
            "analyzed_at": datetime.utcnow().isoformat(),
        }
        video_result = supabase.table("videos").insert(video_data).execute()
        video_id = video_result.data[0]["id"] if video_result.data else None

        # Upload frames and create frame records
        if video_id:
            for i, fp in enumerate(frame_paths):
                try:
                    storage_path, public_url = upload_frame(fp, video_id, i + 1)
                    supabase.table("frames").insert({
                        "video_id": video_id,
                        "storage_path": storage_path,
                        "public_url": public_url,
                        "timestamp_sec": None,
                        "frame_index": i + 1,
                    }).execute()

                    # Set first frame as thumbnail
                    if i == 0:
                        supabase.table("videos").update(
                            {"thumbnail_url": public_url}
                        ).eq("id", video_id).execute()
                except Exception:
                    pass

            # Update creator stats
            if creator_id:
                try:
                    count_result = supabase.table("videos").select("id", count="exact").eq("creator_id", creator_id).execute()
                    video_count = count_result.count or 0
                    supabase.table("creators").update(
                        {"videos_analyzed": video_count}
                    ).eq("id", creator_id).execute()
                except Exception:
                    pass

            # Update category video count
            if category_id:
                try:
                    cat_count = supabase.table("videos").select("id", count="exact").eq("category_id", category_id).execute()
                    supabase.table("categories").update(
                        {"video_count": cat_count.count or 0}
                    ).eq("id", category_id).execute()
                except Exception:
                    pass

        # ── Done ─────────────────────────────────────────────────
        update_job_status(job_id, "complete", 100, "Analysis complete!", video_id=video_id)

    except Exception as e:
        update_job_status(job_id, "failed", 0, error=str(e)[:500])

    finally:
        # Clean up temp files
        try:
            shutil.rmtree(work_dir, ignore_errors=True)
        except Exception:
            pass


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
