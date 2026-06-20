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
              been saved. Selected submissions will be reviewed for the final
              short film, website and social media features.
            </p>
          </motion.div>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp} className="space-y-3 pt-4">
            <Button onClick={handleDownloadAgain} className="w-full">
              Download Again
            </Button>
            <Button
              href="/gallery"
              variant="secondary"
              className="w-full"
            >
              View the Gallery
            </Button>
            <div className="text-center pt-2">
              <button
                onClick={() => {
                  sessionStorage.clear();
                  window.location.href = "/experience";
                }}
                className="text-sm text-muted-light hover:text-muted transition-colors font-light"
              >
                Return to Start
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
