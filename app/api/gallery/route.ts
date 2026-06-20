import { NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

const publicFields =
  "id,created_at,source,reflection,artwork_url,name,social_handle,website_social_opt_in,moderation_status";

export async function GET() {
  const db = supabaseAdmin || supabase;

  if (isSupabaseConfigured() && db) {
    const { data, error } = await db
      .from("submissions")
      .select(publicFields)
      .eq("moderation_status", "approved")
      .eq("website_social_opt_in", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gallery query error:", error);
      return NextResponse.json({ pieces: [] }, { status: 500 });
    }

    return NextResponse.json({ pieces: data || [] });
  }

  return NextResponse.json({ pieces: [] });
}
