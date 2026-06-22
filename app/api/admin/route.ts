import { NextRequest, NextResponse } from "next/server";
import {
  supabaseAdmin,
  getSupabaseServerConfigStatus,
} from "@/lib/supabase";
import { getModerationModel, moderateReflection } from "@/lib/moderation";

// Gate the dashboard behind ADMIN_PASSWORD. Local development may run without
// it, but production fails closed if the env var is missing.
function isAuthorized(request: NextRequest): boolean {
  const required = process.env.ADMIN_PASSWORD;
  if (!required) return process.env.NODE_ENV !== "production";
  return request.headers.get("x-admin-password") === required;
}

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

function hasPublicArtworkUrl(url: unknown) {
  return typeof url === "string" && url.length > 0 && !url.startsWith("data:");
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "health") {
    return NextResponse.json({
      ...getSupabaseServerConfigStatus(),
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      hasAdminPassword: Boolean(process.env.ADMIN_PASSWORD),
      moderationModel: getModerationModel(),
      runtime: process.env.NODE_ENV || "development",
    });
  }

  if (action === "list") {
    const db = supabaseAdmin;
    if (db) {
      const { data, error } = await db
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        return NextResponse.json({ submissions: [], error: error.message });
      }

      return NextResponse.json({ submissions: data || [] });
    }

    if (getSupabaseServerConfigStatus().hasSupabaseUrl) {
      return NextResponse.json(
        {
          submissions: [],
          error:
            "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY in production.",
        },
        { status: 500 }
      );
    }

    // Demo data when Supabase is not configured
    return NextResponse.json({
      submissions: [
        {
          id: "demo-1",
          created_at: new Date().toISOString(),
          source: "in-person",
          reflection: "I was the kid who drew on every surface: napkins, margins, walls. Before 'professional' I was just a creator.",
          artwork_url: null,
          name: "Maya",
          social_handle: "@maya",
          email: "maya@example.com",
          context: "Visiting from Brooklyn",
          short_film_opt_in: true,
          website_social_opt_in: true,
          safety_status: "safe",
          moderation_flagged: false,
          moderation_categories: {},
          moderation_scores: {},
          moderation_model: "demo",
          moderation_reason: null,
          moderation_checked_at: new Date().toISOString(),
          moderation_status: "pending",
          curator_notes: "",
        },
        {
          id: "demo-2",
          created_at: new Date().toISOString(),
          source: "online",
          reflection: "Dreamer. Still am.",
          artwork_url: null,
          name: null,
          social_handle: "@dreamer",
          email: "alex@example.com",
          context: null,
          short_film_opt_in: true,
          website_social_opt_in: false,
          safety_status: "safe",
          moderation_flagged: false,
          moderation_categories: {},
          moderation_scores: {},
          moderation_model: "demo",
          moderation_reason: null,
          moderation_checked_at: new Date().toISOString(),
          moderation_status: "approved",
          curator_notes: "Beautiful simplicity",
        },
      ],
    });
  }

  if (action === "stats") {
    const db = supabaseAdmin;
    if (db) {
      const { data } = await db.from("submissions").select("*");
      const submissions = data || [];

      return NextResponse.json({
        total: submissions.length,
        pending: submissions.filter((s) => s.moderation_status === "pending").length,
        approved: submissions.filter((s) => s.moderation_status === "approved").length,
        rejected: submissions.filter((s) => s.moderation_status === "rejected").length,
        inPerson: submissions.filter((s) => s.source === "in-person").length,
        online: submissions.filter((s) => s.source === "online").length,
        shortFilm: submissions.filter((s) => s.short_film_opt_in).length,
        safe: submissions.filter((s) => s.safety_status === "safe").length,
        flagged: submissions.filter(
          (s) =>
            s.moderation_flagged ||
            s.safety_status === "review" ||
            s.safety_status === "error"
        ).length,
        archiveLive: submissions.filter(
          (s) =>
            s.moderation_status === "approved" &&
            s.website_social_opt_in &&
            hasPublicArtworkUrl(s.artwork_url)
        ).length,
      });
    }

    if (getSupabaseServerConfigStatus().hasSupabaseUrl) {
      return NextResponse.json(
        {
          error:
            "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY in production.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      total: 2,
      pending: 1,
      approved: 1,
      rejected: 0,
      inPerson: 1,
      online: 1,
      shortFilm: 2,
      safe: 2,
      flagged: 0,
      archiveLive: 0,
    });
  }

  return NextResponse.json({ message: "Before the Title Admin API" });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = await request.json();
    const { action, id, field, value } = body;

    const db = supabaseAdmin;

    if (action === "moderate" && db) {
      const { data: submission, error: lookupError } = await db
        .from("submissions")
        .select("id,reflection")
        .eq("id", id)
        .maybeSingle();

      if (lookupError) {
        console.error("Supabase moderation lookup error:", lookupError);
        return NextResponse.json({ error: lookupError.message }, { status: 500 });
      }

      if (!submission) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }

      const moderation = await moderateReflection(submission.reflection);
      const { error: updateError } = await db
        .from("submissions")
        .update({
          safety_status: moderation.safetyStatus,
          moderation_flagged: moderation.flagged,
          moderation_categories: moderation.categories,
          moderation_scores: moderation.scores,
          moderation_model: moderation.model,
          moderation_reason: moderation.reason,
          moderation_checked_at: new Date().toISOString(),
          moderation_status: moderation.moderationStatus,
        })
        .eq("id", id);

      if (updateError) {
        console.error("Supabase moderation update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, moderation });
    }

    if (action === "update" && db) {
      const editableFields = new Set([
        "moderation_status",
        "curator_notes",
        "selected_for_short_film",
        "selected_for_website",
        "selected_for_social",
      ]);

      if (!editableFields.has(field)) {
        return NextResponse.json({ error: "Field is not editable" }, { status: 400 });
      }

      if (
        field === "moderation_status" &&
        !["pending", "approved", "rejected"].includes(String(value))
      ) {
        return NextResponse.json({ error: "Invalid moderation status" }, { status: 400 });
      }

      const { data, error } = await db
        .from("submissions")
        .update({ [field]: value })
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "update" && getSupabaseServerConfigStatus().hasSupabaseUrl) {
      return NextResponse.json(
        {
          error:
            "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY in production.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Unknown action or Supabase not configured" }, { status: 400 });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ error: "Admin operation failed" }, { status: 500 });
  }
}
