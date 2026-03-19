import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { detectPlatform, normalizeUrl } from "@/lib/utils/url";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json(
        { error: "Unsupported URL. Please use TikTok, Instagram, or YouTube." },
        { status: 400 }
      );
    }

    const normalized = normalizeUrl(url);
    const supabase = createServiceClient();

    // Check for duplicate
    const { data: existing } = await supabase
      .from("videos")
      .select("id")
      .eq("url", normalized)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "already_analyzed", videoId: existing.id },
        { status: 409 }
      );
    }

    // Create job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({ url: normalized, platform, status: "queued" })
      .select()
      .single();

    if (jobError || !job) {
      console.error("Job creation error:", jobError);
      return NextResponse.json(
        { error: "Failed to create job", details: jobError?.message || "Unknown error" },
        { status: 500 }
      );
    }

    // Trigger worker (fire-and-forget)
    const workerUrl = process.env.RENDER_WORKER_URL;
    if (workerUrl) {
      fetch(`${workerUrl}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORKER_SECRET || ""}`,
        },
        body: JSON.stringify({ job_id: job.id, url: normalized }),
      }).catch(() => {
        // Worker might be cold-starting
      });
    }

    return NextResponse.json({ jobId: job.id });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
