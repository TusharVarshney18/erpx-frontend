"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./variants";
import { cn } from "../lib/cn";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export function AnimatedText({ text, className, delay = 0, as: Tag = "p" }: AnimatedTextProps) {
  const words = text.split(" ");

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn("inline", className as string)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Tag className="inline">
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={staggerItem}
            className="inline-block"
            style={{ marginRight: "0.25em" }}
          >
            {word}
          </motion.span>
        ))}
      </Tag>
    </motion.div>
  );
}
