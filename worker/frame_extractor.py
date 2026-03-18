"""Keyframe extraction from video using ffmpeg."""

import subprocess
from pathlib import Path


def get_duration(video_path: Path) -> float:
    """Get video duration in seconds via ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                str(video_path),
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return float(result.stdout.strip())
    except (ValueError, Exception):
        return 30.0


def extract_frames(video_path: Path, output_dir: Path, num_frames: int = 6) -> list[Path]:
    """Extract evenly-spaced keyframes from video, resized for Claude's vision API."""
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(exist_ok=True)

    duration = get_duration(video_path)
    margin = min(0.5, duration * 0.05)
    interval = (duration - 2 * margin) / max(num_frames - 1, 1)

    frame_paths: list[Path] = []

    for i in range(num_frames):
        ts = margin + (i * interval)
        fp = frames_dir / f"frame_{i + 1:02d}_{ts:.1f}s.jpg"
        try:
            subprocess.run(
                [
                    "ffmpeg", "-ss", str(ts),
                    "-i", str(video_path),
                    "-vframes", "1",
                    "-q:v", "2",
                    "-vf", "scale='min(1568,iw)':'min(1568,ih)':force_original_aspect_ratio=decrease",
                    "-y", str(fp),
                ],
                capture_output=True,
                timeout=30,
            )
            if fp.exists():
                frame_paths.append(fp)
        except Exception:
            pass

    return frame_paths
