"""Claude API integration for video analysis."""

import base64
import json
import re
from pathlib import Path

import anthropic

from config import ANTHROPIC_API_KEY, CLAUDE_MODEL


def get_claude_client():
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


ANALYSIS_SYSTEM_PROMPT = """You are an expert content strategist analyzing short-form video content (TikTok, Instagram Reels, YouTube Shorts).

You study creator content to understand what makes it effective — hooks, structure, pacing, visual style, tone, and engagement tactics. Your analysis should be specific, actionable, and reference exact moments from the transcript and visual frames provided.

You must respond with ONLY valid JSON matching the exact schema provided. Never include markdown code fences or any text outside the JSON object."""


def build_analysis_prompt(meta: dict, transcript: str, frame_count: int, previous_context: str = "") -> str:
    stats_parts = []
    if meta.get("view_count"):
        stats_parts.append(f"Views: {meta['view_count']:,}")
    if meta.get("like_count"):
        stats_parts.append(f"Likes: {meta['like_count']:,}")
    if meta.get("comment_count"):
        stats_parts.append(f"Comments: {meta['comment_count']:,}")
    stats_line = " | ".join(stats_parts) or "Not available"

    creator = meta.get("uploader", meta.get("channel", "Unknown"))
    title = meta.get("title", "Unknown")
    platform = meta.get("_platform", "unknown")
    duration = meta.get("duration", 0)

    context_note = ""
    if previous_context:
        context_note = f"\n\nPrevious analyses of this creator:\n{previous_context}\nBuild on this knowledge. Note evolution or consistency in their style.\n"

    return f"""Analyze this {platform} video and return a JSON object with this exact structure:

{{
  "hook": {{
    "type": "question|statement|visual|pattern_interrupt|bold_claim|curiosity_gap|shock_value|relatability|story_opening",
    "first_3_seconds": "description of what happens in the first 3 seconds",
    "text": "exact hook text from transcript (first 1-3 sentences)",
    "template": "a reusable template version with [TOPIC] placeholders",
    "effectiveness": <1-10 integer>,
    "effectiveness_reason": "why this score"
  }},
  "visual_style": {{
    "primary_mode": "talking_head|animation|b_roll|screen_recording|mixed",
    "secondary_mode": "string or null",
    "lighting": "natural|studio|mixed|dramatic",
    "framing": "close|medium|wide|varies",
    "text_overlays": "description of text overlay style and placement",
    "production_level": "low|medium|high"
  }},
  "structure_pacing": {{
    "total_length_seconds": {duration},
    "scene_changes": "<estimated count as integer>",
    "scene_pattern": "description of the scene change pattern",
    "pacing": "fast|medium|slow|variable",
    "rhythm_description": "how the pacing creates rhythm and keeps attention"
  }},
  "content_technique": {{
    "explanation_style": "analogy|story|step_by_step|comparison|demonstration|rant|list",
    "tone": "educational|entertaining|inspirational|provocative|conversational|authoritative",
    "key_technique": "the single most important thing that makes this content work",
    "tone_descriptors": ["array", "of", "3-5", "descriptors"]
  }},
  "cta": {{
    "type": "follow|like|comment|share|link|none",
    "placement": "beginning|middle|end|throughout|none",
    "text": "exact CTA text if any, or empty string"
  }},
  "suggested_category": "best matching category from: Education, Science Communication, Storytelling, Comedy / Entertainment, Motivation / Mindset, Business / Finance, Lifestyle / Vlog, Tech / Product Review, Health / Fitness, News / Commentary",
  "suggested_tags": ["3-6", "relevant", "tags"],
  "key_takeaway": "One paragraph: what should a new creator learn from this video? Be specific about adaptable techniques, not generic advice."
}}

Video: "{title}" by {creator} on {platform}
Duration: {duration}s | Stats: {stats_line}
{context_note}
Transcript:
{transcript}

The images above are {frame_count} evenly-spaced keyframes from the video.
Be specific. Reference exact transcript moments and frame numbers in your analysis."""


def analyze_video(
    frame_paths: list[Path],
    meta: dict,
    transcript: str,
    previous_context: str = "",
) -> dict | None:
    """Send frames + transcript to Claude for structured analysis. Returns parsed JSON."""
    client = get_claude_client()

    content_parts = []

    # Add frames as base64 images
    for fp in frame_paths:
        try:
            with open(fp, "rb") as f:
                img_data = base64.standard_b64encode(f.read()).decode("utf-8")
            content_parts.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": img_data},
            })
            content_parts.append({"type": "text", "text": f"[Keyframe: {fp.name}]"})
        except Exception:
            pass

    # Add prompt text
    prompt = build_analysis_prompt(meta, transcript, len(frame_paths), previous_context)
    content_parts.append({"type": "text", "text": prompt})

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        system=ANALYSIS_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content_parts}],
    )

    raw = response.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    # Try to fix common JSON issues
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to extract JSON from the response
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None
