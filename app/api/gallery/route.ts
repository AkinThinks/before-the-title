import { NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { fallbackGalleryPieces } from "@/lib/fallbackGallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

function galleryResponse(pieces: ReturnType<typeof toPublicPiece>[]) {
  return NextResponse.json(
    { pieces: pieces.length > 0 ? pieces : fallbackGalleryPieces },
    { headers: noStoreHeaders }
  );
}

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
  const canShowCredit = Boolean(row.website_social_opt_in);

  return {
    id: row.id,
    created_at: row.created_at,
    source: row.source || "online",
    reflection: row.reflection,
    artwork_url: row.artwork_url,
    name: canShowCredit ? row.name : null,
    social_handle: canShowCredit ? row.social_handle || null : null,
    website_social_opt_in: canShowCredit,
    moderation_status: row.moderation_status || "pending",
  };
}

function hasPublicArtworkUrl(url: string | null) {
  return Boolean(url && !url.startsWith("data:"));
}

export async function GET() {
  const db = supabaseAdmin || supabase;

  if (isSupabaseConfigured() && db) {
    const { data, error } = await db
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gallery query error:", error);
      return galleryResponse([]);
    }

    const pieces = (data || [])
      .filter(
        (row) =>
          (row.moderation_status || "pending") === "approved" &&
          Boolean(row.website_social_opt_in) &&
          hasPublicArtworkUrl(row.artwork_url)
      )
      .map(toPublicPiece);

    return galleryResponse(pieces);
  }

  return galleryResponse([]);
}
