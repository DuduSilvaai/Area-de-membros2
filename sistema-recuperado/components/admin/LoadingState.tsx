'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export function LoadingState({ rows = 5, columns = 5, className }: LoadingStateProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Deterministic width helper to avoid hydration mismatch
    const getWidth = (index: number, min: number, max: number) => {
        if (!mounted) return `${(min + max) / 2}px`;
        const seeds = [0.65, 0.42, 0.88, 0.31, 0.76, 0.19, 0.94, 0.53];
        const seed = seeds[index % seeds.length];
        return `${seed * (max - min) + min}px`;
    };

    return (
        <div className={cn('w-full', className)}>
            {/* Table skeleton */}
            <div className="overflow-hidden">
                {/* Header skeleton */}
                <div className="bg-white/5 border-b border-white/5 px-6 py-4">
                    <div className="flex items-center gap-6">
                        {Array.from({ length: columns }).map((_, i) => (
                            <div
                                key={`header-${i}`}
                                className="h-4 bg-white/10 rounded animate-pulse"
                                style={{ width: getWidth(i, 60, 100) }}
                            />
                        ))}
                    </div>
                </div>

                {/* Rows skeleton */}
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="border-b border-white/5 px-6 py-4"
                    >
                        <div className="flex items-center gap-6">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    className={cn(
                                        'h-4 bg-white/5 rounded animate-pulse',
                                        colIndex === 1 && 'flex items-center gap-3'
                                    )}
                                    style={{
                                        width: colIndex === 0 ? '80px' : getWidth(rowIndex * columns + colIndex, 50, 130),
                                        animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                                    }}
                                >
                                    {/* Avatar + name for user column */}
                                    {colIndex === 1 && (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
                                            <div className="flex flex-col gap-1.5">
                                                <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                                                <div className="h-2 w-32 bg-white/5 rounded animate-pulse" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer skeleton */}
            <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-center justify-between">
                    <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
                    <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`page-${i}`} className="w-8 h-8 bg-white/5 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Simple spinner component for inline loading
export function LoadingSpinner({ size = 20, className }: { size?: number; className?: string }) {
    return (
        <div
            className={cn('animate-spin', className)}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-full h-full"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.2"
                />
                <path
                    d="M12 2C6.477 2 2 6.477 2 12"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

export default LoadingState;
