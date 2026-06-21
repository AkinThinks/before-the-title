"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
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

export default function WelcomeScreen() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const src = searchParams.get("src");
    if (src === "inperson" || src === "in-person") {
      sessionStorage.setItem("source", "in-person");
    } else if (src === "online") {
      sessionStorage.setItem("source", "online");
    }
  }, [searchParams]);

  return (
    <main className="h-full flex flex-col items-center justify-center px-6 relative">
      <div className="relative z-10 text-center max-w-lg mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div custom={0} variants={fadeUp}>
            <p className="text-sm tracking-[0.3em] uppercase text-muted-light font-light">
              A Living Art Project
            </p>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight"
          >
            Before
            <br />
            the Title
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted leading-relaxed font-light max-w-md mx-auto"
          >
            Your reflection becomes art.
            <br />
            Your voice becomes story.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          >
            <Button href="/reflect">Add Your Reflection</Button>
            <Button href="/event" variant="ghost">
              Project Details
            </Button>
          </motion.div>

          <motion.p
            custom={4}
            variants={fadeUp}
            className="text-xs text-muted-light font-light leading-relaxed max-w-xs mx-auto pt-6"
          >
            An ongoing participatory art project about who we are beyond our titles.
          </motion.p>
        </motion.div>
      </div>
    </main>
  );
}
