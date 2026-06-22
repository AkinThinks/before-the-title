import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getSupabaseServerConfigStatus,
} from "@/lib/supabase";
import {
  moderationStatusFromSafety,
  type ArchiveModerationStatus,
  type SafetyStatus,
} from "@/lib/moderation";

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

function normalizeSafetyStatus(value: unknown): SafetyStatus {
  if (
    value === "safe" ||
    value === "review" ||
    value === "rejected" ||
    value === "error" ||
    value === "unchecked"
  ) {
    return value;
  }

  return "unchecked";
}

function resolveSubmissionStatus(
  currentStatus: unknown,
  safetyStatus: SafetyStatus
): ArchiveModerationStatus {
  if (currentStatus === "rejected") return "rejected";
  if (currentStatus === "approved" && safetyStatus === "unchecked") {
    return "approved";
  }

  return moderationStatusFromSafety(safetyStatus);
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

    if (!submissionId || !String(submissionId).trim()) {
      return NextResponse.json(
        { error: "Submission was not saved. Please try again." },
        { status: 400 }
      );
    }

    const db = supabaseAdmin;
    if (db) {
      const { data: existing, error: lookupError } = await db
        .from("submissions")
        .select("id,safety_status,moderation_status")
        .eq("id", submissionId)
        .maybeSingle();

      if (lookupError) {
        console.error("Supabase lookup error:", lookupError);
        throw lookupError;
      }

      if (!existing) {
        return NextResponse.json(
          { error: "Submission was not found. Please try again." },
          { status: 404 }
        );
      }

      const nextModerationStatus = resolveSubmissionStatus(
        existing.moderation_status,
        normalizeSafetyStatus(existing.safety_status)
      );

      const update = {
        name: name && String(name).trim() ? String(name).trim() : null,
        social_handle: socialHandle || social_handle || null,
        email: email || null,
        context: context || null,
        short_film_opt_in: shortFilmOptIn || false,
        website_social_opt_in: websiteSocialOptIn || false,
        participant_type: participantType || "online",
        source: normalizeSource(source || participantType),
        moderation_status: nextModerationStatus,
      };

      const { data, error } = await db
        .from("submissions")
        .update(update)
        .eq("id", submissionId)
        .select("id")
        .maybeSingle();

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
            moderation_status: update.moderation_status,
          };
          const { data: fallbackData, error: fallbackError } = await db
            .from("submissions")
            .update(fallbackUpdate)
            .eq("id", submissionId)
            .select("id")
            .maybeSingle();

          if (!fallbackError && fallbackData) {
            return NextResponse.json({
              success: true,
              submissionId,
              socialHandleStored: false,
            });
          }

          if (!fallbackError && !fallbackData) {
            return NextResponse.json(
              { error: "Submission was not found. Please try again." },
              { status: 404 }
            );
          }

          console.error("Supabase fallback update error:", fallbackError);
          throw fallbackError;
        }

        console.error("Supabase update error:", error);
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          { error: "Submission was not found. Please try again." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, submissionId });
    }

    if (getSupabaseServerConfigStatus().hasSupabaseUrl) {
      return NextResponse.json(
        {
          error:
            "Archive storage is not configured. Please try again later.",
        },
        { status: 500 }
      );
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
