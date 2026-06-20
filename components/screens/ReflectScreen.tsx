"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import ProgressBar from "@/components/ui/ProgressBar";

export default function ReflectScreen() {
  const [reflection, setReflection] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (reflection.trim()) {
      sessionStorage.setItem("reflection", reflection.trim());
      router.push("/consent");
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
          <ProgressBar current={1} total={3} />
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
              Who were you
              <br />
              before the title?
            </h2>
            <p className="text-muted font-light text-sm leading-relaxed">
              Share a word, phrase, memory, sound, feeling or creative idea.
              <br />
              It can be simple, poetic, personal or abstract.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="I was the kid who..."
              rows={5}
              maxLength={500}
              className="w-full bg-surface border border-border rounded-tl-[20px] rounded-tr-[6px] rounded-br-[20px] rounded-bl-[6px] px-6 py-5 text-lg leading-relaxed placeholder:text-muted-light/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all duration-300 resize-none"
            />
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-xs text-muted-light font-light">
                Take your time
              </p>
              <p className="text-xs text-muted-light font-light">
                {reflection.length}/500
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              onClick={handleSubmit}
              disabled={!reflection.trim()}
              className="w-full"
            >
              Create My Artwork
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}
