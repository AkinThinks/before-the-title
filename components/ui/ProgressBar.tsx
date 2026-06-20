"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="h-[2px] bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="text-xs text-muted-light mt-3 text-center font-light tracking-wide">
        {current} of {total}
      </p>
    </div>
  );
}
