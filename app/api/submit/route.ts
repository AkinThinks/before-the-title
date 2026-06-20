import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

function normalizeSource(value: unknown) {
  return value === "in-person" || value === "inperson" ? "in-person" : "online";
}

function isMissingSocialHandleColumn(error: { message?: string; code?: string }) {
  const message = error.message || "";
  return (
    error.code === "PGRST204" ||
    message.includes("social_handle") ||
    message.includes("schema cache")
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      submissionId,
      name,
      socialHandle,
      social_handle,
      email,
      context,
      shortFilmOptIn,
      websiteSocialOptIn,
      participantType,
      source,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Credit name is required" },
        { status: 400 }
      );
    }

    const db = supabaseAdmin || supabase;
    if (isSupabaseConfigured() && db) {
      const update = {
        name: String(name).trim(),
        social_handle: socialHandle || social_handle || null,
        email: email || null,
        context: context || null,
        short_film_opt_in: shortFilmOptIn || false,
        website_social_opt_in: websiteSocialOptIn || false,
        participant_type: participantType || "online",
        source: normalizeSource(source || participantType),
      };

      const { error } = await db
        .from("submissions")
        .update(update)
        .eq("id", submissionId);

      if (error) {
        if (isMissingSocialHandleColumn(error)) {
          const fallbackUpdate = {
            name: update.name,
            email: update.email,
            context: update.context,
            short_film_opt_in: update.short_film_opt_in,
            website_social_opt_in: update.website_social_opt_in,
            participant_type: update.participant_type,
            source: update.source,
          };
          const { error: fallbackError } = await db
            .from("submissions")
            .update(fallbackUpdate)
            .eq("id", submissionId);

          if (!fallbackError) {
            return NextResponse.json({
              success: true,
              submissionId,
              socialHandleStored: false,
            });
          }

          console.error("Supabase fallback update error:", fallbackError);
          throw fallbackError;
        }

        console.error("Supabase update error:", error);
        throw error;
      }
    }

    return NextResponse.json({ success: true, submissionId });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to store submission" },
      { status: 500 }
    );
  }
}
