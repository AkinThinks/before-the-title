import { NextRequest, NextResponse } from "next/server";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const db = supabaseAdmin || supabase;

  if (isSupabaseConfigured() && db) {
    const { data, error } = await db
      .from("submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Gallery detail query error:", error);
      return NextResponse.json({ piece: null }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ piece: null }, { status: 404 });
    }

    return NextResponse.json({ piece: toPublicPiece(data) });
  }

  return NextResponse.json({ piece: null }, { status: 404 });
}
