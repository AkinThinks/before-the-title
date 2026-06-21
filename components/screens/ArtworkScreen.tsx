"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function ArtworkScreen() {
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setArtworkUrl(sessionStorage.getItem("artworkUrl"));
      setSubmissionId(sessionStorage.getItem("submissionId"));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleDownload = async () => {
    if (!artworkUrl) return;
    setDownloading(true);

    try {
      const response = await fetch(artworkUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `before-the-title-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(artworkUrl, "_blank");
    }
    setDownloading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md mx-auto relative z-10"
      >
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <p className="text-sm tracking-[0.2em] uppercase text-muted-light font-light mb-3">
              Your artwork
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl leading-tight tracking-tight"
            >
              Your reflection
              <br />
              became art.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {artworkUrl ? (
              <div className="relative w-full aspect-[4/5] rounded-tl-[24px] rounded-tr-[6px] rounded-br-[24px] rounded-bl-[6px] overflow-hidden shadow-2xl shadow-primary/10">
                <Image
                  src={artworkUrl}
                  alt="Your artwork"
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-cover"
                  unoptimized
                  onError={() => {
                    if (!imageFailed) {
                      setImageFailed(true);
                      setArtworkUrl("/art/abstract.jpg");
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="w-full aspect-[4/5] bg-surface-warm rounded-tl-[24px] rounded-tr-[6px] rounded-br-[24px] rounded-bl-[6px] flex items-center justify-center">
                <p className="text-muted-light font-light">Loading artwork...</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <Button
              onClick={handleDownload}
              disabled={!artworkUrl || downloading}
              className="w-full"
            >
              {downloading ? "Downloading..." : "Download Artwork"}
            </Button>

            {submissionId ? (
              <Button
                onClick={() => router.push("/contribute")}
                variant="secondary"
                className="w-full"
              >
                Add to the Collective Story
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-light font-light leading-relaxed">
                  This piece was not saved to the archive. You can download it
                  or try again.
                </p>
                <Button
                  onClick={() => router.push("/reflect")}
                  variant="secondary"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => router.push("/reflect")}
                className="text-sm text-muted-light hover:text-muted transition-colors font-light"
              >
                Create Another Version
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
