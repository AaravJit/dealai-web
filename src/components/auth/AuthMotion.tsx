"use client";

import { motion, useReducedMotion } from "framer-motion";
import React from "react";

export function AuthMotion({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  const container = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        },
      };

  return (
    <motion.div {...(container as any)} className="w-full">
      {children}
    </motion.div>
  );
}

export function FieldStagger({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? undefined : "hidden"}
      animate={reduce ? undefined : "show"}
      variants={
        reduce
          ? undefined
          : {
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.06 },
              },
            }
      }
      className="space-y-3"
    >
      {children}
    </motion.div>
  );
}

export function FieldItem({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      variants={
        reduce
          ? undefined
          : {
              hidden: { opacity: 0, y: 8, filter: "blur(6px)" },
              show: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
}
