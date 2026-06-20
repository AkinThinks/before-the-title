import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function normalizeSource(value: unknown) {
  return value === "in-person" || value === "inperson" ? "in-person" : "online";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      submissionId,
      name,
      email,
      context,
      shortFilmOptIn,
      websiteSocialOptIn,
      participantType,
      source,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from("submissions")
        .update({
          name: name || null,
          email,
          context: context || null,
          short_film_opt_in: shortFilmOptIn || false,
          website_social_opt_in: websiteSocialOptIn || false,
          participant_type: participantType || "online",
          source: normalizeSource(source || participantType),
        })
        .eq("id", submissionId);

      if (error) {
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
