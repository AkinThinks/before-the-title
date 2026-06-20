import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const publicFields =
  "id,created_at,source,reflection,artwork_url,name,social_handle,website_social_opt_in,moderation_status";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const db = supabaseAdmin || supabase;

  if (isSupabaseConfigured() && db) {
    const { data, error } = await db
      .from("submissions")
      .select(publicFields)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Gallery detail query error:", error);
      return NextResponse.json({ piece: null }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ piece: null }, { status: 404 });
    }

    return NextResponse.json({ piece: data });
  }

  return NextResponse.json({ piece: null }, { status: 404 });
}
