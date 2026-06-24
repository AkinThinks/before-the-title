import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { moderateReflection, type ModerationDecision } from "@/lib/moderation";

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

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickVariant<T>(items: T[], seed: number, offset = 0) {
  return items[(seed + offset) % items.length];
}

const visualLanguages = [
  "architectural memory map: rooms, thresholds, windows, passageways, and small constructed worlds",
  "textile memory: woven threads, quilt-like fragments, embroidered edges, and soft handmade layers",
  "botanical inner landscape: roots, petals, seeds, leaves, and organic growth forms as emotional symbols",
  "cinematic shadow play: window light, silhouettes, reflections, atmosphere, and intimate stage-like space",
  "topographic dream map: contour lines, rivers of color, islands, paths, and terrain shaped by memory",
  "ceramic relief: sculptural clay surfaces, carved marks, raised forms, and tactile handmade depth",
  "street-mural abstraction: bold shapes, layered walls, weathered color, and public-memory energy",
  "constellation archive: night-sky diagrams, luminous points, orbiting shapes, and quiet cosmic structure",
  "paper theater: cut-paper depth, miniature sets, curtains, portals, and dimensional storybook space",
  "sound made visible: rhythm lines, pulses, echoes, waveforms, and color fields reacting like music",
  "object shrine: ordinary childhood objects arranged like sacred evidence of a younger self",
  "water memory: ripples, translucent washes, submerged shapes, reflection, and fluid transformation",
];

const compositions = [
  "asymmetrical, with the main emotional weight pushed toward one edge",
  "bird's-eye view, like looking down into a private world or remembered map",
  "close and tactile, as if the viewer is almost touching the surface",
  "wide and cinematic, with a small human trace inside a larger atmosphere",
  "radial, with memory fragments orbiting a quiet center",
  "split-level, showing two emotional states in the same image without a literal before-and-after",
  "diagonal movement across the frame, like a path being discovered",
  "layered foreground, middle ground, and background, like a small stage of memory",
];

const materialDirections = [
  "transparent watercolor, graphite dust, and soft paper grain",
  "oil pastel, dry brush, and visible hand-smudged texture",
  "risograph-like ink layers with imperfect registration and grain",
  "cyanotype-inspired light, deep blues, and photographic softness",
  "collaged paper, torn edges, translucent vellum, and subtle shadows",
  "encaustic wax, scratched marks, and luminous depth",
  "ceramic glaze, matte clay, and carved surface details",
  "soft digital painting mixed with scanned handmade textures",
];

const paletteAccents = [
  "midnight blue, coastal teal, warm ivory, and a restrained sunrise coral accent",
  "deep green, mist gray, soft gold, and small notes of clay red",
  "indigo, sea glass, charcoal, pale cream, and muted copper",
  "forest green, moonlit blue, pearl white, and a single amber glow",
  "ink blue, weathered sage, cloud white, and dusty rose",
  "soft black, eucalyptus, cool silver, and warm ochre",
];

function buildImagePrompt(reflection: string, submissionId: string) {
  const seed = hashString(`${submissionId}:${reflection}`);
  const visualLanguage = pickVariant(visualLanguages, seed);
  const composition = pickVariant(compositions, seed, 3);
  const materialDirection = pickVariant(materialDirections, seed, 7);
  const paletteAccent = pickVariant(paletteAccents, seed, 11);

  return `Create a singular emotional artwork inspired by this reflection: "${reflection}".

The artwork belongs to "Before the Title," an ongoing participatory art project about identity before public labels.

Primary visual language for this piece: ${visualLanguage}.
Composition: ${composition}.
Material and texture: ${materialDirection}.
Palette: ${paletteAccent}. It may still feel related to the wider Before the Title archive, but this piece must have its own distinct visual identity.

Anchor the image in the concrete emotional clues of the reflection. If the reflection suggests childhood, movement, sound, objects, places, questions, light, nature, building, maps, silence, or imagination, make that specific clue drive the image.

Human presence should be suggested through gesture, scale, trace, silhouette, negative space, or objects touched by a person. Do not make a realistic portrait unless the reflection clearly calls for one.

Avoid a repeated template. Do not default to the same centered glowing figure, the same abstract swirl, or the same generic archive look. This should feel like one distinct artwork within a larger living collection.

No text, no words, no letters, no logos, no readable symbols.
Feel: intimate, luminous, emotionally grounded, communal, and timeless.`;
}

export async function POST(request: NextRequest) {
  // Read the body once up front so the catch block can still build a fallback.
  let reflection = "";
  let source = "online";
  let moderation: ModerationDecision | null = null;
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

    moderation = await moderateReflection(reflection);

    if (moderation.safetyStatus === "rejected") {
      return NextResponse.json(
        {
          error: "That reflection cannot be processed. Please try a different reflection.",
          stored: false,
          safetyStatus: moderation.safetyStatus,
          moderationStatus: moderation.moderationStatus,
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    let artworkUrl: string;
    let originalArtworkUrl: string | null = null;
    let imagePersisted = false;
    let archiveError: string | null = null;
    const galleryUrl = `${getPublicBaseUrl(request)}/gallery/${submissionId}`;

    if (apiKey) {
      const prompt = buildImagePrompt(reflection, submissionId);

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
        const persisted = await persistImage(b64, submissionId);
        artworkUrl = persisted.artworkUrl;
        originalArtworkUrl = persisted.originalArtworkUrl;
        imagePersisted = persisted.persisted;
        archiveError = persisted.error;
      } else if (url) {
        // Some models return a (temporary) URL instead.
        artworkUrl = url;
        imagePersisted = false;
      } else {
        throw new Error("No image returned");
      }
    } else {
      // Demo mode: generate a placeholder
      artworkUrl = generatePlaceholderArtwork(reflection);
    }

    // Store submission in Supabase with the service-role client so writes are
    // not blocked by public RLS policies.
    let stored = false;
    const db = supabaseAdmin;
    if (db) {
      const { error } = await db.from("submissions").insert({
        id: submissionId,
        source,
        reflection,
        artwork_url: artworkUrl,
        download_url: originalArtworkUrl,
        consent: true,
        safety_status: moderation.safetyStatus,
        moderation_flagged: moderation.flagged,
        moderation_categories: moderation.categories,
        moderation_scores: moderation.scores,
        moderation_model: moderation.model,
        moderation_reason: moderation.reason,
        moderation_checked_at: new Date().toISOString(),
        moderation_status: moderation.moderationStatus,
      });

      if (error) {
        archiveError = error.message;
        console.error("Supabase insert error:", error);
      } else {
        stored = true;
      }
    } else {
      archiveError =
        "Archive storage is not configured.";
      console.error(
        "Supabase service role is not configured. Add SUPABASE_SERVICE_ROLE_KEY in production."
      );
    }

    return NextResponse.json({
      artworkUrl,
      submissionId: stored ? submissionId : null,
      galleryUrl: stored ? galleryUrl : null,
      stored,
      imagePersisted,
      archiveError,
      safetyStatus: moderation.safetyStatus,
      moderationStatus: moderation.moderationStatus,
    });
  } catch (error) {
    console.error("Generation error:", error);

    // Fallback: return a placeholder so the user still sees something, and
    // persist it when possible so downstream contribution still has a real row.
    const artworkUrl = generatePlaceholderArtwork(reflection);
    let stored = false;
    const db = supabaseAdmin;

    if (reflection && db) {
      const { error: insertError } = await db.from("submissions").insert({
        id: submissionId,
        source,
        reflection,
        artwork_url: artworkUrl,
        download_url: null,
        consent: true,
        safety_status: moderation?.safetyStatus || "error",
        moderation_flagged: true,
        moderation_categories: moderation?.categories || {},
        moderation_scores: moderation?.scores || {},
        moderation_model:
          moderation?.model ||
          process.env.OPENAI_MODERATION_MODEL ||
          "omni-moderation-latest",
        moderation_reason:
          moderation?.reason || "Artwork generation failed after moderation.",
        moderation_checked_at: moderation ? new Date().toISOString() : null,
        moderation_status: "pending",
      });

      if (insertError) {
        console.error("Fallback Supabase insert error:", insertError);
      } else {
        stored = true;
      }
    }

    return NextResponse.json({
      artworkUrl,
      submissionId: stored ? submissionId : null,
      galleryUrl: stored ? `${getPublicBaseUrl(request)}/gallery/${submissionId}` : null,
      fallback: true,
      stored,
      imagePersisted: false,
      archiveError: stored
        ? null
        : "Artwork generation fell back and was not saved to Supabase.",
      safetyStatus: moderation?.safetyStatus || "error",
      moderationStatus: "pending",
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
  submissionId: string
): Promise<{
  artworkUrl: string;
  originalArtworkUrl: string | null;
  persisted: boolean;
  error: string | null;
}> {
  const dataUri = `data:image/png;base64,${b64}`;

  // Upload with the service-role client. Public clients should not write to
  // storage in production.
  const storage = supabaseAdmin;
  if (!storage) {
    return {
      artworkUrl: dataUri,
      originalArtworkUrl: null,
      persisted: false,
      error:
        "Archive image storage is not configured.",
    };
  }

  try {
    const bytes = Buffer.from(b64, "base64");
    const path = `${submissionId}.png`;

    const { error } = await storage.storage
      .from("artworks")
      .upload(path, bytes, { contentType: "image/png", upsert: true });

    if (error) {
      console.error("Supabase artwork upload error:", error.message);
      return {
        artworkUrl: dataUri,
        originalArtworkUrl: null,
        persisted: false,
        error: "Archive image storage failed.",
      };
    }

    const { data } = storage.storage.from("artworks").getPublicUrl(path);

    return {
      artworkUrl: data.publicUrl || dataUri,
      originalArtworkUrl: null,
      persisted: Boolean(data.publicUrl),
      error: data.publicUrl ? null : "Archive image storage failed.",
    };
  } catch (e) {
    console.error("Image persist error:", e);
    return {
      artworkUrl: dataUri,
      originalArtworkUrl: null,
      persisted: false,
      error: "Image upload failed.",
    };
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
