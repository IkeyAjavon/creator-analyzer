"""Audio transcription via Groq's Whisper API."""

import logging
import subprocess
from pathlib import Path

import requests

from config import GROQ_API_KEY

logger = logging.getLogger(__name__)

GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions"


def extract_audio(video_path: Path, output_dir: Path) -> Path | None:
    """Extract audio from video using ffmpeg."""
    audio_path = output_dir / "audio.mp3"
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-i", str(video_path),
                "-vn", "-acodec", "libmp3lame",
                "-ar", "16000", "-ac", "1",
                "-b:a", "64k",
                "-y", str(audio_path),
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if audio_path.exists() and audio_path.stat().st_size > 0:
            return audio_path
        logger.error(f"Audio extraction failed: {result.stderr[:300]}")
    except Exception as e:
        logger.error(f"Audio extraction exception: {e}")
    return None


def transcribe_audio(audio_path: Path) -> str | None:
    """Transcribe audio using Groq's Whisper API."""
    if not GROQ_API_KEY:
        logger.warning("No GROQ_API_KEY set, skipping transcription")
        return None

    try:
        with open(audio_path, "rb") as f:
            response = requests.post(
                GROQ_WHISPER_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                files={"file": ("audio.mp3", f, "audio/mpeg")},
                data={
                    "model": "whisper-large-v3",
                    "language": "en",
                    "response_format": "text",
                },
                timeout=120,
            )

        if response.status_code == 200:
            text = response.text.strip()
            if text:
                logger.info(f"Transcribed {len(text.split())} words")
                return text
            logger.warning("Transcription returned empty text")
        else:
            logger.error(f"Groq API error {response.status_code}: {response.text[:300]}")
    except Exception as e:
        logger.error(f"Transcription exception: {e}")

    return None


def transcribe_video(video_path: Path, work_dir: Path) -> str | None:
    """Full pipeline: extract audio then transcribe."""
    audio_path = extract_audio(video_path, work_dir)
    if not audio_path:
        return None
    return transcribe_audio(audio_path)
