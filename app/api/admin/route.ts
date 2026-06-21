import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

// Gate the dashboard behind ADMIN_PASSWORD. If the env var is unset the gate is
// open (useful for local/demo); set it in production to require the password.
function isAuthorized(request: NextRequest): boolean {
  const required = process.env.ADMIN_PASSWORD;
  if (!required) return true;
  return request.headers.get("x-admin-password") === required;
}

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "list") {
    const db = supabaseAdmin || supabase;
    if (isSupabaseConfigured() && db) {
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
          moderation_status: "approved",
          curator_notes: "Beautiful simplicity",
        },
      ],
    });
  }

  if (action === "stats") {
    const db = supabaseAdmin || supabase;
    if (isSupabaseConfigured() && db) {
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
      });
    }

    return NextResponse.json({
      total: 2,
      pending: 1,
      approved: 1,
      rejected: 0,
      inPerson: 1,
      online: 1,
      shortFilm: 2,
    });
  }

  return NextResponse.json({ message: "Before the Title Admin API" });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = await request.json();
    const { action, id, field, value } = body;

    const db = supabaseAdmin || supabase;
    if (action === "update" && isSupabaseConfigured() && db) {
      const { error } = await db
        .from("submissions")
        .update({ [field]: value })
        .eq("id", id);

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action or Supabase not configured" }, { status: 400 });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ error: "Admin operation failed" }, { status: 500 });
  }
}
