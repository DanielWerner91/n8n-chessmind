"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
}: {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-[#0f1623] text-white transition-bg",
        className
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ backgroundPosition: "0% 50%" }}
          animate={{
            backgroundPosition: ["0% 50%", "200% 50%", "0% 50%"],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
            repeatType: "mirror",
          }}
          className="absolute inset-0 z-0 h-full w-full scale-[2] transform-gpu bg-transparent opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(100deg, var(--emerald-1) 10%, var(--emerald-2) 15%, var(--emerald-3) 20%, var(--emerald-4) 25%, var(--emerald-5) 30%)`,
            backgroundSize: "200% 200%",
            "--emerald-1": "#059669",
            "--emerald-2": "#10B981",
            "--emerald-3": "#6EE7B7",
            "--emerald-4": "#059669",
            "--emerald-5": "#10B98180",
          } as React.CSSProperties}
        />
        {showRadialGradient && (
          <div className="pointer-events-none absolute inset-0 z-10 h-full w-full bg-[radial-gradient(ellipse_at_100%_0%,transparent_60%,#0f1623)]" />
        )}
        <div className="pointer-events-none absolute inset-0 z-10 h-full w-full bg-[radial-gradient(ellipse_at_0%_100%,transparent_60%,#0f1623)]" />
      </div>
      <div className="relative z-20">{children}</div>
    </div>
  );
}
