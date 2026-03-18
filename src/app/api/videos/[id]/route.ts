import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: video, error } = await supabase
    .from("videos")
    .select("*, creator:creators(*), category:categories(*), frames(*)")
    .eq("id", id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return NextResponse.json(video);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};
  if (body.category_id !== undefined) updateData.category_id = body.category_id;
  if (body.tags !== undefined) updateData.tags = body.tags;

  const { data, error } = await supabase
    .from("videos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
