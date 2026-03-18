"""Supabase Storage helpers for uploading frames."""

from pathlib import Path
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_SERVICE_KEY


def get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upload_frame(frame_path: Path, video_id: str, frame_index: int) -> tuple[str, str]:
    """Upload a frame to Supabase Storage. Returns (storage_path, public_url)."""
    supabase = get_supabase()
    storage_path = f"{video_id}/frame_{frame_index:02d}.jpg"

    with open(frame_path, "rb") as f:
        supabase.storage.from_("frames").upload(
            storage_path,
            f.read(),
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )

    public_url = supabase.storage.from_("frames").get_public_url(storage_path)
    return storage_path, public_url


def update_job_status(
    job_id: str,
    status: str,
    progress: int,
    message: str | None = None,
    error: str | None = None,
    video_id: str | None = None,
):
    """Update job status in Supabase."""
    supabase = get_supabase()
    update_data: dict = {
        "status": status,
        "progress": progress,
    }
    if message:
        update_data["status_message"] = message
    if error:
        update_data["error_message"] = error
    if video_id:
        update_data["video_id"] = video_id
    if status == "downloading":
        update_data["worker_started_at"] = "now()"
    if status in ("complete", "failed"):
        update_data["worker_completed_at"] = "now()"

    supabase.table("jobs").update(update_data).eq("id", job_id).execute()
