"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

type GalleryPiece = {
  id: string;
  created_at: string;
  source: string;
  reflection: string;
  artwork_url: string | null;
  name: string | null;
  social_handle: string | null;
  website_social_opt_in: boolean;
  moderation_status: string;
};

export default function GalleryDetailPage() {
  const params = useParams<{ id: string }>();
  const [piece, setPiece] = useState<GalleryPiece | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/gallery/${encodeURIComponent(params.id)}`)
      .then((res) => {
        if (!res.ok) return { piece: null };
        return res.json();
      })
      .then((data) => setPiece(data.piece || null))
      .catch(() => setPiece(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-muted-light font-light">
        Loading piece...
      </main>
    );
  }

  if (!piece) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-5">
          <h1 className="font-display text-4xl tracking-tight">Piece not found</h1>
          <Button href="/gallery">View Gallery</Button>
        </div>
      </main>
    );
  }

  const isPublic =
    piece.moderation_status === "approved" && piece.website_social_opt_in;

  return (
    <main className="min-h-screen px-6 py-12 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square overflow-hidden rounded-tl-[28px] rounded-tr-[8px] rounded-br-[28px] rounded-bl-[8px] border border-border bg-surface shadow-2xl shadow-primary/10"
        >
          {piece.artwork_url ? (
            <Image
              src={piece.artwork_url}
              alt={`Artwork by ${piece.name || "a participant"}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-light">
              No image
            </div>
          )}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="space-y-7"
        >
          <div className="space-y-4">
            <p className="text-xs tracking-[0.28em] uppercase text-muted-light font-light">
              Before the Title Archive
            </p>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight tracking-tight">
              {piece.name || "Before the Title participant"}
            </h1>
            {piece.social_handle && (
              <p className="text-muted font-light">{piece.social_handle}</p>
            )}
          </div>

          <blockquote className="text-2xl sm:text-3xl font-display leading-snug tracking-tight">
            &ldquo;{piece.reflection}&rdquo;
          </blockquote>

          <p className="text-sm text-muted-light font-light leading-relaxed">
            {isPublic
              ? "This piece is part of the public collective gallery."
              : "Public gallery placement requires archive permission and curator approval."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button href="/gallery" variant="secondary">
              View Archive
            </Button>
            <Button href="/film" variant="ghost">
              Project Film
            </Button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
