"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export default function Button({
  children,
  href,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center px-8 py-4 text-base font-medium transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed select-none min-h-[56px]";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] rounded-[10px]",
    secondary:
      "bg-surface border-2 border-primary text-primary hover:bg-primary/5 active:scale-[0.97] rounded-[10px]",
    ghost:
      "bg-transparent text-muted hover:text-foreground hover:bg-surface-warm active:scale-[0.97] rounded-[10px]",
  };

  const combined = `${baseStyles} ${variants[variant]} ${className}`;

  const MotionLink = motion.create(Link);
  const MotionButton = motion.create("button");

  if (href) {
    return (
      <MotionLink
        href={href}
        className={combined}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <MotionButton
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combined}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {children}
    </MotionButton>
  );
}
