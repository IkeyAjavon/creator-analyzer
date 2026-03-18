export const ANALYSIS_SYSTEM_PROMPT = `You are an expert content strategist analyzing short-form video content (TikTok, Instagram Reels, YouTube Shorts).

You study creator content to understand what makes it effective — hooks, structure, pacing, visual style, tone, and engagement tactics. Your analysis should be specific, actionable, and reference exact moments from the transcript and visual frames provided.

You must respond with ONLY valid JSON matching the exact schema provided. Never include markdown code fences or any text outside the JSON object.`;

export function buildAnalysisPrompt(meta: {
  platform: string;
  creator: string;
  title: string;
  duration: number;
  views: number | null;
  likes: number | null;
  comments: number | null;
  frameCount: number;
  previousAnalyses?: string;
}, transcript: string): string {
  const statsLine = [
    meta.views != null ? `Views: ${meta.views.toLocaleString()}` : null,
    meta.likes != null ? `Likes: ${meta.likes.toLocaleString()}` : null,
    meta.comments != null ? `Comments: ${meta.comments.toLocaleString()}` : null,
  ].filter(Boolean).join(" | ") || "Not available";

  let contextNote = "";
  if (meta.previousAnalyses) {
    contextNote = `\n\nPrevious analyses of this creator:\n${meta.previousAnalyses}\nBuild on this knowledge. Note evolution or consistency in their style.\n`;
  }

  return `Analyze this ${meta.platform} video and return a JSON object with this exact structure:

{
  "hook": {
    "type": "question|statement|visual|pattern_interrupt|bold_claim|curiosity_gap|shock_value|relatability|story_opening",
    "first_3_seconds": "description of what happens in the first 3 seconds",
    "text": "exact hook text from transcript (first 1-3 sentences)",
    "template": "a reusable template version with [TOPIC] placeholders",
    "effectiveness": <1-10 integer>,
    "effectiveness_reason": "why this score"
  },
  "visual_style": {
    "primary_mode": "talking_head|animation|b_roll|screen_recording|mixed",
    "secondary_mode": "string or null",
    "lighting": "natural|studio|mixed|dramatic",
    "framing": "close|medium|wide|varies",
    "text_overlays": "description of text overlay style and placement",
    "production_level": "low|medium|high"
  },
  "structure_pacing": {
    "total_length_seconds": ${meta.duration || 0},
    "scene_changes": <estimated count>,
    "scene_pattern": "description of the scene change pattern",
    "pacing": "fast|medium|slow|variable",
    "rhythm_description": "how the pacing creates rhythm and keeps attention"
  },
  "content_technique": {
    "explanation_style": "analogy|story|step_by_step|comparison|demonstration|rant|list",
    "tone": "educational|entertaining|inspirational|provocative|conversational|authoritative",
    "key_technique": "the single most important thing that makes this content work",
    "tone_descriptors": ["array", "of", "3-5", "descriptors"]
  },
  "cta": {
    "type": "follow|like|comment|share|link|none",
    "placement": "beginning|middle|end|throughout|none",
    "text": "exact CTA text if any, or empty string"
  },
  "suggested_category": "best matching category from: Education, Science Communication, Storytelling, Comedy / Entertainment, Motivation / Mindset, Business / Finance, Lifestyle / Vlog, Tech / Product Review, Health / Fitness, News / Commentary",
  "suggested_tags": ["3-6", "relevant", "tags"],
  "key_takeaway": "One paragraph: what should a new creator learn from this video? Be specific about adaptable techniques, not generic advice."
}

Video: "${meta.title}" by ${meta.creator} on ${meta.platform}
Duration: ${meta.duration}s | Stats: ${statsLine}
${contextNote}
Transcript:
${transcript}

The images above are ${meta.frameCount} evenly-spaced keyframes from the video.
Be specific. Reference exact transcript moments and frame numbers in your analysis.`;
}

export const CATEGORIZE_SYSTEM_PROMPT = `You are a content taxonomy expert. Review the video library and suggest improvements to the category system. Return ONLY valid JSON.`;

export function buildReclassifyPrompt(
  categories: { name: string; video_count: number }[],
  videos: { id: string; title: string; category: string; hook_type: string; tone: string; style: string }[]
): string {
  return `Review this video library taxonomy.

Current categories:
${categories.map(c => `- ${c.name}: ${c.video_count} videos`).join("\n")}

Recent videos:
${videos.map(v => `- "${v.title}" [current: ${v.category}] Hook: ${v.hook_type}, Style: ${v.style}, Tone: ${v.tone}`).join("\n")}

Return JSON:
{
  "new_categories": [{"name": "...", "description": "...", "color": "#hex"}],
  "reclassifications": [{"video_id": "uuid", "new_category": "category_name", "reason": "..."}],
  "merge_suggestions": [{"merge": ["cat1", "cat2"], "into": "new_name", "reason": "..."}]
}

Only suggest changes if clearly warranted. Empty arrays are fine if the current taxonomy works well.`;
}

export function buildCreationSystemPrompt(styleContext: string, mode: string): string {
  const modeInstructions: Record<string, string> = {
    hooks: "Generate 10 hook variations for the user's topic. Each should use a different technique from the style library. Format as numbered list with technique in brackets.",
    script: "Write a complete short-form video script (30-90 seconds). Include: [HOOK], [BODY], [CTA] sections with timing. Use visual cues in brackets like [cut to], [text overlay], [b-roll].",
    ideas: "Generate 10 content ideas with titles, hook concepts, and brief descriptions. Adapt techniques from the style library.",
    calendar: "Create a 7-day content calendar with daily video concepts. Include title, hook type, duration, and key talking points.",
    freeform: "Help the user create content based on their request. Use analyzed styles as inspiration.",
  };

  return `You are a creative content strategist helping a creator develop their own unique short-form video content.

${styleContext}

${modeInstructions[mode] || modeInstructions.freeform}

Help them develop their OWN voice, not copy others. Reference analyzed styles as inspiration. Use markdown formatting.`;
}
