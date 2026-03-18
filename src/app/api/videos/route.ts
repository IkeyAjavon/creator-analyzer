import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const category = searchParams.get("category");
  const creator = searchParams.get("creator");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = createServiceClient();

  let query = supabase
    .from("videos")
    .select("*, creator:creators(*), category:categories(*), frames(*)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (platform) query = query.eq("platform", platform);
  if (category) query = query.eq("category_id", category);
  if (creator) query = query.eq("creator_id", creator);
  if (search) query = query.or(`title.ilike.%${search}%,transcript.ilike.%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ videos: data, total: count });
}
