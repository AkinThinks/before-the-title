"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

type GalleryPiece = {
  id: string;
  created_at: string;
  reflection: string;
  artwork_url: string | null;
  name: string | null;
  social_handle: string | null;
};

export default function GalleryPage() {
  const [pieces, setPieces] = useState<GalleryPiece[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((data) => setPieces(data.pieces || []))
      .catch(() => setPieces([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
        >
          <div className="max-w-2xl space-y-4">
            <p className="text-xs sm:text-sm tracking-[0.28em] uppercase text-muted-light font-light">
              Before the Title
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight">
              Living Archive
            </h1>
            <p className="text-muted font-light leading-relaxed max-w-xl">
              A living archive of community reflections and artworks from the
              people who stepped beyond their titles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button href="/experience" variant="secondary">
              Add Your Reflection
            </Button>
            <Button href="/film" variant="ghost">
              Project Film
            </Button>
          </div>
        </motion.header>

        {loading ? (
          <div className="py-20 text-center text-muted-light font-light">
            Loading gallery...
          </div>
        ) : pieces.length === 0 ? (
          <div className="py-20 text-center space-y-5">
            <p className="text-muted-light font-light">
              The public archive is opening soon.
            </p>
            <Button href="/experience">Add Your Reflection</Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pieces.map((piece, index) => (
              <motion.div
                key={piece.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  href={`/gallery/${piece.id}`}
                  className="group block h-full rounded-tl-[20px] rounded-tr-[6px] rounded-br-[20px] rounded-bl-[6px] border border-border bg-surface overflow-hidden"
                >
                  <div className="relative aspect-square bg-background">
                    {piece.artwork_url ? (
                      <Image
                        src={piece.artwork_url}
                        alt={`Artwork by ${piece.name || "a participant"}`}
                        fill
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-light text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-lg leading-snug">
                      &ldquo;{piece.reflection}&rdquo;
                    </p>
                    <div className="text-sm text-muted-light font-light flex flex-wrap gap-x-3 gap-y-1">
                      <span>{piece.name || "Before the Title participant"}</span>
                      {piece.social_handle && <span>{piece.social_handle}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
