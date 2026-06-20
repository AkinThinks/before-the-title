import { NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

type SubmissionRow = {
  id: string;
  created_at: string;
  source?: string;
  reflection: string;
  artwork_url: string | null;
  name: string | null;
  social_handle?: string | null;
  website_social_opt_in?: boolean;
  moderation_status?: string;
};

function toPublicPiece(row: SubmissionRow) {
  return {
    id: row.id,
    created_at: row.created_at,
    source: row.source || "online",
    reflection: row.reflection,
    artwork_url: row.artwork_url,
    name: row.name,
    social_handle: row.social_handle || null,
    website_social_opt_in: Boolean(row.website_social_opt_in),
    moderation_status: row.moderation_status || "pending",
  };
}

export async function GET() {
  const db = supabaseAdmin || supabase;

  if (isSupabaseConfigured() && db) {
    const { data, error } = await db
      .from("submissions")
      .select("*")
      .eq("moderation_status", "approved")
      .eq("website_social_opt_in", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gallery query error:", error);
      return NextResponse.json({ pieces: [] }, { status: 500 });
    }

    return NextResponse.json({ pieces: (data || []).map(toPublicPiece) });
  }

  return NextResponse.json({ pieces: [] });
}
