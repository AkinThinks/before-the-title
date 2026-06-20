"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

export default function ConsentScreen() {
  const [agreed, setAgreed] = useState(false);
  const router = useRouter();

  const handleContinue = () => {
    if (agreed) {
      sessionStorage.setItem("consent", "true");
      router.push("/generating");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="mb-10">
          <ProgressBar current={2} total={3} />
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h2
              className="font-display text-3xl sm:text-4xl leading-tight tracking-tight mb-4"
            >
              One more moment
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="bg-surface rounded-tl-[24px] rounded-tr-[6px] rounded-br-[24px] rounded-bl-[6px] border border-border p-6 space-y-5"
          >
            <p className="text-sm text-muted leading-relaxed font-light">
              By continuing, I understand that my submitted input and generated
              artwork may be reviewed, curated and considered for inclusion in
              the event&apos;s short film, website, recap materials and social media
              features. Submission does not guarantee inclusion. Personal
              identifying details will not be shared publicly unless separately
              authorized.
            </p>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-tl-[4px] rounded-tr-[12px] rounded-br-[4px] rounded-bl-[12px] border-2 border-border peer-checked:border-primary peer-checked:bg-primary transition-all duration-200 flex items-center justify-center">
                  {agreed && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-foreground font-medium leading-snug">
                I agree
              </span>
            </label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              onClick={handleContinue}
              disabled={!agreed}
              className="w-full"
            >
              Continue
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
