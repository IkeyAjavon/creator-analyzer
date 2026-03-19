"""Video downloading via yt-dlp with platform-specific configs."""

import json
import re
import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def detect_platform(url: str) -> str:
    lower = url.lower()
    if "tiktok" in lower:
        return "tiktok"
    elif "instagram" in lower:
        return "instagram"
    elif "youtu" in lower:
        return "youtube"
    return "unknown"


def get_video_metadata(url: str) -> dict:
    """Fetch video metadata without downloading."""
    try:
        args = [
            "yt-dlp", "--dump-json", "--no-download",
            "--no-check-certificates",
            "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            url,
        ]
        result = subprocess.run(args, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            return json.loads(result.stdout)
        logger.error(f"Metadata fetch failed: {result.stderr[:500]}")
    except Exception as e:
        logger.error(f"Metadata exception: {e}")
    return {}


def download_video(url: str, output_dir: Path) -> Path | None:
    """Download video to output_dir. Returns path to downloaded file or None."""
    video_path = output_dir / "video.mp4"

    platform = detect_platform(url)
    args = [
        "yt-dlp",
        "-f", "best[ext=mp4]/best",
        "-o", str(video_path),
        "--no-playlist",
        "--no-check-certificates",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ]

    if platform == "youtube":
        args.extend([
            "--extractor-args", "youtube:player_client=web",
        ])

    args.append(url)

    logger.info(f"Downloading: {url}")
    result = subprocess.run(args, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        logger.error(f"Download failed. stderr: {result.stderr[:1000]}")
        logger.error(f"Download failed. stdout: {result.stdout[:500]}")

    if video_path.exists():
        return video_path

    # Check for alternate extensions
    for f in output_dir.iterdir():
        if f.suffix in (".mp4", ".webm", ".mkv"):
            return f

    return None


def get_youtube_captions(url: str, output_dir: Path) -> str | None:
    """Try to get YouTube auto-captions without downloading the video."""
    try:
        result = subprocess.run(
            [
                "yt-dlp",
                "--write-auto-subs",
                "--sub-lang", "en",
                "--skip-download",
                "--sub-format", "srt",
                "--no-check-certificates",
                "-o", str(output_dir / "captions"),
                url,
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        # Look for downloaded caption files
        for f in output_dir.iterdir():
            if f.suffix in (".srt", ".vtt"):
                text = f.read_text()
                # Strip SRT formatting to plain text
                lines = []
                for line in text.split("\n"):
                    line = line.strip()
                    if not line:
                        continue
                    if re.match(r"^\d+$", line):
                        continue
                    if re.match(r"^\d{2}:\d{2}", line):
                        continue
                    if line.startswith("WEBVTT"):
                        continue
                    lines.append(line)
                return " ".join(lines)
    except Exception:
        pass
    return None


def safe_filename(text: str, max_len: int = 30) -> str:
    """Sanitize text for use in filenames."""
    return re.sub(r"[^\w\s-]", "", text).strip()[:max_len]
