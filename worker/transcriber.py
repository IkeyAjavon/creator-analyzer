"""Audio extraction and transcription via Whisper."""

import subprocess
from pathlib import Path

from config import WHISPER_MODEL


def extract_audio(video_path: Path, output_dir: Path) -> Path | None:
    """Extract audio from video as MP3."""
    audio_path = output_dir / "audio.mp3"
    try:
        subprocess.run(
            [
                "ffmpeg", "-i", str(video_path),
                "-vn", "-acodec", "libmp3lame",
                "-q:a", "4", "-y", str(audio_path),
            ],
            capture_output=True,
            timeout=60,
        )
        if audio_path.exists():
            return audio_path
    except Exception:
        pass
    return None


def transcribe_audio(audio_path: Path, output_dir: Path, model: str | None = None) -> str:
    """Transcribe audio using Whisper CLI. Returns transcript text."""
    model = model or WHISPER_MODEL
    whisper_dir = output_dir / "whisper_output"
    whisper_dir.mkdir(exist_ok=True)

    try:
        subprocess.run(
            [
                "whisper", str(audio_path),
                "--model", model,
                "--output_dir", str(whisper_dir),
                "--output_format", "all",
                "--language", "en",
            ],
            capture_output=True,
            text=True,
            timeout=300,
        )

        # Read transcript text
        txt_files = list(whisper_dir.glob("*.txt"))
        if txt_files:
            return txt_files[0].read_text().strip()
    except Exception:
        pass

    return "[No audio could be transcribed]"
