"use client";

import { Play, Info } from "lucide-react";
import { motion } from "framer-motion";

interface HeroBannerProps {
    title: string;
    description: string | null;
    imageUrl: string | null;
    onStartConfig?: {
        label: string;
        onClick: () => void;
    };
}

export function HeroBanner({
    title,
    description,
    imageUrl,
    onStartConfig,
}: HeroBannerProps) {
    return (
        <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden rounded-2xl shadow-floating">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                style={{
                    backgroundImage: `url(${imageUrl || "/images/placeholder-course.jpg"})`,
                }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0D] via-[#0A0A0D]/60 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-10 flex flex-col items-start gap-4 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white tracking-wider uppercase mb-3 inline-block">
                        Destaque
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 leading-tight">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-gray-300 text-lg md:text-xl line-clamp-3 mb-6 max-w-2xl">
                            {description}
                        </p>
                    )}

                    {onStartConfig && (
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={onStartConfig.onClick}
                                className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary hover:bg-primary-hover text-white font-semibold transition-all hover:scale-105 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                {onStartConfig.label}
                            </button>
                            <button className="flex items-center gap-2 px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold transition-all border border-white/10">
                                <Info className="w-5 h-5" />
                                Mais Detalhes
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
