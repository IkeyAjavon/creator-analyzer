import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { buildCreationSystemPrompt } from "@/lib/claude/prompts";

export async function POST(request: Request) {
  try {
    const { prompt, style_filter, history } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key not configured. Add it in Settings." },
        { status: 500 }
      );
    }

    const supabase = createServiceClient();
    const client = new Anthropic({ apiKey });

    // Build style context from analyzed videos
    let styleContext = "## Style Intelligence\n\n";

    const { data: videos } = await supabase
      .from("videos")
      .select("title, analysis_json, creator:creators(name, platform)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!videos || videos.length === 0) {
      styleContext += "No videos analyzed yet. Analyze some creator videos first for better results.\n";
    } else {
      let filtered = videos;
      if (style_filter && style_filter !== "all") {
        filtered = videos.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (v: any) => {
            const c = v.creator;
            return c && c.name?.toLowerCase() === style_filter.toLowerCase();
          }
        );
      }

      styleContext += `Based on ${filtered.length} analyzed videos:\n\n`;

      for (const v of filtered.slice(0, 10)) {
        const a = v.analysis_json as Record<string, unknown> | null;
        if (!a) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const creatorData = v.creator as any;
        const hook = a.hook as Record<string, string> | undefined;
        const technique = a.content_technique as Record<string, unknown> | undefined;

        styleContext += `**${creatorData?.name || "Unknown"} - ${(String(v.title) || "?").slice(0, 40)}**\n`;
        styleContext += `  Hook: ${hook?.type || "?"} | Tone: ${technique?.tone || "?"}\n`;
        if (technique?.key_technique) {
          styleContext += `  Key: ${technique.key_technique}\n`;
        }
        styleContext += "\n";
      }
    }

    // Build messages from history
    const messages: Anthropic.MessageParam[] = (history || [])
      .filter((m: { role: string }) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    messages.push({ role: "user", content: prompt });

    const systemPrompt = buildCreationSystemPrompt(styleContext, "freeform");

    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
