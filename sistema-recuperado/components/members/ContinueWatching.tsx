"use client";

import { PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ContinueWatchingProps {
    lessonId: string;
    portalId: string;
    title: string;
    thumbnailUrl?: string | null;
    progressPercentage?: number;
    timeLeft?: string;
    onClick?: () => void;
}

export function ContinueWatching({
    lessonId,
    portalId,
    title,
    thumbnailUrl,
    progressPercentage = 0,
    timeLeft,
}: ContinueWatchingProps) {
    return (
        <Link href={`/members/${portalId}/lesson/${lessonId}`} className="group block h-full">
            <motion.div
                className="relative overflow-hidden rounded-xl bg-surface border border-border-subtle hover:border-primary/50 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] h-full flex flex-col"
                whileHover={{ y: -4 }}
            >
                {/* Thumbnail Section */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                            <PlayCircle className="w-12 h-12 text-white/20 group-hover:text-primary transition-colors duration-300" />
                        </div>
                    )}

                    {/* Overlay Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                            <PlayCircle className="w-6 h-6 text-white ml-0.5 fill-current" />
                        </div>
                    </div>

                    {/* Progress Bar Bottom */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                        <div
                            className="h-full bg-primary shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs font-medium text-primary mb-1 uppercase tracking-wide">
                        Continuar Assistindo
                    </span>
                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary-hover transition-colors mb-2">
                        {title}
                    </h3>

                    <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                        <span>Aula em andamento</span>
                        {timeLeft && <span>Restam {timeLeft}</span>}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
