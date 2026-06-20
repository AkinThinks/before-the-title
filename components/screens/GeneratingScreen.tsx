"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const messages = [
  "Translating your reflection into image...",
  "Finding the shape of your story...",
  "Creating your visual memory...",
  "Woven your words into color and light...",
];

export default function GeneratingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    const generateArt = async () => {
      const reflection = sessionStorage.getItem("reflection") || "";
      const source = sessionStorage.getItem("source") || "online";

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reflection, source }),
        });

        const data = await res.json();

        if (!res.ok || !data.artworkUrl) {
          throw new Error(data.error || "Artwork generation failed");
        }

        if (data.artworkUrl) {
          sessionStorage.setItem("artworkUrl", data.artworkUrl);
          sessionStorage.setItem("submissionId", data.submissionId);
          if (data.galleryUrl) {
            sessionStorage.setItem("galleryUrl", data.galleryUrl);
          }
        }
      } catch {
        // If generation fails, use a real bundled fallback image.
        sessionStorage.setItem("artworkUrl", "/art/abstract.jpg");
        sessionStorage.setItem("submissionId", "demo-" + Date.now());
        sessionStorage.removeItem("galleryUrl");
      }

      clearInterval(interval);

      // Brief pause so the last message is visible
      setTimeout(() => {
        router.push("/artwork");
      }, 1200);
    };

    // Start generation after a short delay for UX
    const timer = setTimeout(generateArt, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Gradient background overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] animate-gradient"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary), var(--color-secondary), var(--color-accent-teal), var(--color-accent-sage))",
          backgroundSize: "400% 400%",
        }}
      />

      <div className="relative z-10 text-center max-w-sm mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-12"
        >
          {/* Blooming flower */}
          <div className="relative w-36 h-36 mx-auto">
            <motion.img
              src="/flowers/rose.jpg"
              alt="Blooming flower"
              className="w-full h-full object-cover rounded-full"
              style={{
                filter: "saturate(0.8) brightness(1.05)",
                maskImage:
                  "radial-gradient(circle, white 35%, transparent 65%)",
                WebkitMaskImage:
                  "radial-gradient(circle, white 35%, transparent 65%)",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: [1, 1.06, 1],
              }}
              transition={{
                opacity: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
                scale: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />
          </div>

          {/* Rotating messages */}
          <div className="h-16 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg text-muted font-light leading-relaxed"
              >
                {messages[messageIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
