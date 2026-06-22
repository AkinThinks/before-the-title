"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export default function ConfirmationScreen() {
  const handleDownloadAgain = () => {
    const artworkUrl = sessionStorage.getItem("artworkUrl");
    if (artworkUrl) {
      window.open(artworkUrl, "_blank");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md mx-auto relative z-10"
      >
        <div className="space-y-10 text-center">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
            {/* Success icon */}
            <div className="w-20 h-20 mx-auto mb-8 rounded-tl-[16px] rounded-tr-[6px] rounded-br-[16px] rounded-bl-[6px] bg-primary/10 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring", bounce: 0.4 }}
              >
                <svg
                  className="w-10 h-10 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </motion.div>
            </div>
          </motion.div>

          <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
            <h2
              className="font-display text-4xl sm:text-5xl leading-tight tracking-tight mb-4"
            >
              You are now part
              <br />
              of the story.
            </h2>
          </motion.div>

          <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp}>
            <p className="text-muted font-light leading-relaxed max-w-sm mx-auto">
              Thank you for contributing to Before the Title. Your artwork has
              been received. If you gave public archive permission and it passes
              safety review, it can appear automatically.
            </p>
          </motion.div>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="space-y-3 pt-4">
            <Button onClick={handleDownloadAgain} className="w-full">
              Download Artwork
            </Button>
            <Button
              href="/gallery"
              variant="secondary"
              className="w-full"
            >
              View the Archive
            </Button>
            <a
              href="https://www.instagram.com/alin.bullion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[56px] w-full items-center justify-center rounded-[10px] bg-transparent px-8 py-4 text-base font-medium text-muted transition-all duration-300 ease-out hover:bg-surface-warm hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
            >
              Follow the Project
            </a>
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  sessionStorage.clear();
                  window.location.href = "/experience";
                }}
                className="text-sm text-muted-light hover:text-muted transition-colors font-light"
              >
                Create Another Reflection
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
