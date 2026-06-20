import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

// Image generation can take 20-30s; allow headroom on serverless platforms.
export const maxDuration = 60;
export const runtime = "nodejs";

// OpenAI image model. gpt-image-1 returns the image as base64 bytes (b64_json),
// which we can persist directly. Override with OPENAI_IMAGE_MODEL if desired
// (e.g. "gpt-image-1.5", "gpt-image-2").
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

function normalizeSource(value: unknown) {
  return value === "in-person" || value === "inperson" ? "in-person" : "online";
}

function getPublicBaseUrl(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return request.nextUrl.origin;
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
    let originalArtworkUrl: string | null = null;
    const galleryUrl = `${getPublicBaseUrl(request)}/gallery/${submissionId}`;

    if (apiKey) {
      const prompt = `Create an abstract, emotional artwork inspired by this reflection: "${reflection}".
The artwork belongs to "Before the Title," a North to Shore Festival experience about identity before public labels.
Style: a civic dream portrait, layered painterly abstraction like memory becoming a public mural.
Visual motifs: subtle shoreline-to-city rhythm, wave forms, transit-line movement, stage-light glow, brick-city warmth, and Newark creative energy without literal landmarks.
Human presence: suggested through silhouette, aura, gesture, or negative space, not a realistic face.
Collection palette: midnight blue, coastal teal, deep green, warm ivory, soft gold, and restrained brick red.
Feel: intimate, luminous, communal, festival-ready, and emotionally grounded.
Composition: one clear focal presence with flowing organic layers, leaving the lower-right corner visually calm for a small archive mark added later.
No text, no words, no letters, no logos, no QR codes in the generated image.
Make it feel like one artwork in a larger living gallery of New Jersey voices.`;

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
        const persisted = await persistImage(b64, submissionId, galleryUrl);
        artworkUrl = persisted.artworkUrl;
        originalArtworkUrl = persisted.originalArtworkUrl;
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
        download_url: originalArtworkUrl,
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
async function persistImage(
  b64: string,
  submissionId: string,
  galleryUrl: string
): Promise<{ artworkUrl: string; originalArtworkUrl: string | null }> {
  const dataUri = `data:image/png;base64,${b64}`;

  // Upload with the service-role client (falls back to the public client if no
  // secret key is set, which requires a permissive storage policy).
  const storage = supabaseAdmin || supabase;
  if (!storage) return { artworkUrl: dataUri, originalArtworkUrl: null };

  try {
    const bytes = Buffer.from(b64, "base64");
    const originalPath = `${submissionId}-original.png`;
    const finalPath = `${submissionId}.png`;
    let finalBytes: Buffer<ArrayBufferLike> = bytes;

    try {
      const { createQrArtworkPng } = await import("@/lib/qr-artwork");
      finalBytes = await createQrArtworkPng({
        imageBytes: bytes,
        targetUrl: galleryUrl,
      });
    } catch (qrError) {
      console.error("QR artwork compose error:", qrError);
    }

    const { error: originalError } = await storage.storage
      .from("artworks")
      .upload(originalPath, bytes, { contentType: "image/png", upsert: true });

    if (originalError) {
      console.error("Supabase original upload error:", originalError.message);
    }

    const { error: finalError } = await storage.storage
      .from("artworks")
      .upload(finalPath, finalBytes, { contentType: "image/png", upsert: true });

    if (finalError) {
      console.error("Supabase artwork upload error:", finalError.message);
      return { artworkUrl: dataUri, originalArtworkUrl: null };
    }

    const { data: finalData } = storage.storage
      .from("artworks")
      .getPublicUrl(finalPath);
    const { data: originalData } = storage.storage
      .from("artworks")
      .getPublicUrl(originalPath);

    return {
      artworkUrl: finalData.publicUrl || dataUri,
      originalArtworkUrl: originalError ? null : originalData.publicUrl || null,
    };
  } catch (e) {
    console.error("Image persist error:", e);
    return { artworkUrl: dataUri, originalArtworkUrl: null };
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
