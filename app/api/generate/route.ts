import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

// Image generation can take 20-30s; allow headroom on serverless platforms.
export const maxDuration = 60;

// OpenAI image model. gpt-image-1 returns the image as base64 bytes (b64_json),
// which we can persist directly. Override with OPENAI_IMAGE_MODEL if desired
// (e.g. "gpt-image-1.5", "gpt-image-2").
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

function normalizeSource(value: unknown) {
  return value === "in-person" || value === "inperson" ? "in-person" : "online";
}

export async function POST(request: NextRequest) {
  // Read the body once up front so the catch block can still build a fallback.
  let reflection = "";
  let source = "online";
  try {
    const body = await request.json();
    reflection = body.reflection || "";
    source = normalizeSource(body.source);
  } catch {
    /* invalid JSON -> handled below */
  }

  const submissionId =
    "sub-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

  try {
    if (!reflection) {
      return NextResponse.json(
        { error: "Reflection is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    let artworkUrl: string;

    if (apiKey) {
      const prompt = `Create an abstract, emotional artwork inspired by this reflection: "${reflection}".
Style: dreamy, textured, painterly with layered brushstrokes.
Colors: deep blues, sage greens, warm whites, soft golds.
Feel: nostalgic, beautiful, contemplative, intimate.
Composition: flowing organic shapes suggesting memory and identity.
No text, no words, no letters in the image.
Fine art quality, gallery-worthy.`;

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: IMAGE_MODEL,
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "medium",
            // Less restrictive filtering so innocent personal reflections
            // aren't false-positive blocked by the output moderator.
            moderation: "low",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("OpenAI error:", JSON.stringify(error));
        throw new Error("Image generation failed");
      }

      const data = await response.json();
      const b64: string | undefined = data.data?.[0]?.b64_json;
      const url: string | undefined = data.data?.[0]?.url;

      if (b64) {
        // We have the raw bytes. Persist to Supabase Storage when configured so
        // the image survives long-term; otherwise inline it as a data URI.
        artworkUrl = await persistImage(b64, submissionId);
      } else if (url) {
        // Some models return a (temporary) URL instead.
        artworkUrl = url;
      } else {
        throw new Error("No image returned");
      }
    } else {
      // Demo mode: generate a placeholder
      artworkUrl = generatePlaceholderArtwork(reflection);
    }

    // Store submission in Supabase if configured (server-side writes prefer the
    // service-role client so they aren't subject to public RLS policies).
    const db = supabaseAdmin || supabase;
    if (isSupabaseConfigured() && db) {
      const { error } = await db.from("submissions").insert({
        id: submissionId,
        source,
        reflection,
        artwork_url: artworkUrl,
        consent: true,
        moderation_status: "pending",
      });

      if (error) {
        console.error("Supabase insert error:", error);
      }
    }

    return NextResponse.json({ artworkUrl, submissionId });
  } catch (error) {
    console.error("Generation error:", error);

    // Fallback: return a placeholder so the user still sees something
    return NextResponse.json({
      artworkUrl: generatePlaceholderArtwork(reflection),
      submissionId: "fallback-" + Date.now(),
      fallback: true,
    });
  }
}

/**
 * Turns base64 PNG bytes into a durable image URL. If Supabase is configured we
 * upload to the "artworks" storage bucket and return its public URL; otherwise
 * (or if the upload fails) we fall back to an inline data URI so the flow still
 * works without any storage set up.
 */
async function persistImage(b64: string, submissionId: string): Promise<string> {
  const dataUri = `data:image/png;base64,${b64}`;

  // Upload with the service-role client (falls back to the public client if no
  // secret key is set, which requires a permissive storage policy).
  const storage = supabaseAdmin || supabase;
  if (!storage) return dataUri;

  try {
    const bytes = Buffer.from(b64, "base64");
    const path = `${submissionId}.png`;
    const { error } = await storage.storage
      .from("artworks")
      .upload(path, bytes, { contentType: "image/png", upsert: true });

    if (error) {
      console.error("Supabase storage upload error:", error.message);
      return dataUri;
    }

    const { data } = storage.storage.from("artworks").getPublicUrl(path);
    return data.publicUrl || dataUri;
  } catch (e) {
    console.error("Image persist error:", e);
    return dataUri;
  }
}

function generatePlaceholderArtwork(reflection: string): string {
  const seed = reflection.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = (seed * 37) % 360;
  const hue2 = (hue1 + 40) % 360;
  const hue3 = (hue1 + 80) % 360;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1}, 30%, 85%)"/>
          <stop offset="100%" style="stop-color:hsl(${hue2}, 25%, 75%)"/>
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="40"/>
        </filter>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)"/>
      <circle cx="${300 + (seed % 400)}" cy="${200 + (seed % 300)}" r="${150 + (seed % 100)}" 
        fill="hsl(${hue2}, 35%, 70%)" filter="url(#blur)" opacity="0.6"/>
      <circle cx="${500 + (seed % 200)}" cy="${400 + (seed % 200)}" r="${120 + (seed % 80)}" 
        fill="hsl(${hue3}, 30%, 80%)" filter="url(#blur)" opacity="0.5"/>
      <ellipse cx="512" cy="512" rx="${200 + (seed % 100)}" ry="${150 + (seed % 80)}" 
        fill="hsl(${hue1}, 25%, 90%)" filter="url(#blur)" opacity="0.4" 
        transform="rotate(${seed % 360}, 512, 512)"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
