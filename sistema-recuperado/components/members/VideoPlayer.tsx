'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with any cast to avoid type issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

interface VideoPlayerProps {
    url: string;
    onEnded?: () => void;
    autoPlay?: boolean;
}

export default function VideoPlayer({ url, onEnded, autoPlay = false }: VideoPlayerProps) {
    const playerRef = useRef<any>(null);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height="100%"
                controls
                playing={autoPlay}
                onEnded={onEnded}
                config={{
                    youtube: {
                        playerVars: { showinfo: 1, modestbranding: 1 }
                    } as any
                }}
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
        </div>
    );
}
