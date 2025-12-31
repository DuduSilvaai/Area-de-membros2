"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OverallProgressBarProps {
    progress: number;
    className?: string;
}

export function OverallProgressBar({ progress, className }: OverallProgressBarProps) {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className={cn("w-full space-y-2", className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Progresso Geral</span>
                <span className="font-bold text-primary">{Math.round(clampedProgress)}%</span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/50">
                <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}
