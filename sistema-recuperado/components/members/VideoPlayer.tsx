'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
    videoUrl: string | null;
    title: string;
    onComplete?: () => void;
}

export default function VideoPlayer({ videoUrl, title, onComplete }: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Detect video type from URL
    const getVideoType = (url: string | null): 'youtube' | 'vimeo' | 'direct' | null => {
        if (!url) return null;
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
        if (url.includes('vimeo.com')) return 'vimeo';
        return 'direct';
    };

    // Get embed URL for YouTube/Vimeo
    const getEmbedUrl = (url: string): string => {
        const videoType = getVideoType(url);

        if (videoType === 'youtube') {
            // Extract video ID
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            const videoId = match ? match[1] : '';
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
        }

        if (videoType === 'vimeo') {
            const match = url.match(/vimeo\.com\/(\d+)/);
            const videoId = match ? match[1] : '';
            return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
        }

        return url;
    };

    const videoType = getVideoType(videoUrl);

    // Handle video progress for direct videos
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progressPercent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progressPercent);

            // Trigger complete when video is 90% watched
            if (progressPercent >= 90 && onComplete) {
                onComplete();
            }
        }
    };

    // Placeholder when no video
    if (!videoUrl) {
        return (
            <div
                className="relative w-full"
                style={{ aspectRatio: '16/9' }}
            >
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{ backgroundColor: '#0F0F12' }}
                >
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                        style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                        <Play className="w-8 h-8" style={{ color: 'var(--text-disabled)' }} />
                    </div>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                        {title}
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                        Selecione uma aula para começar
                    </p>
                </div>
            </div>
        );
    }

    // YouTube or Vimeo embed
    if (videoType === 'youtube' || videoType === 'vimeo') {
        return (
            <div
                className="relative w-full"
                style={{ aspectRatio: '16/9' }}
            >
                {isLoading && (
                    <div
                        className="absolute inset-0 flex items-center justify-center z-10"
                        style={{ backgroundColor: '#0F0F12' }}
                    >
                        <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary-main)' }} />
                    </div>
                )}
                <iframe
                    src={getEmbedUrl(videoUrl)}
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        );
    }

    // Direct video playback
    return (
        <div
            className="relative w-full group"
            style={{ aspectRatio: '16/9' }}
        >
            {isLoading && (
                <div
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ backgroundColor: '#0F0F12' }}
                >
                    <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary-main)' }} />
                </div>
            )}

            <video
                ref={videoRef}
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ backgroundColor: '#0F0F12' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedData={() => setIsLoading(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
            />

            {/* Custom Controls Overlay (shown on hover) */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                }}
            >
                {/* Progress bar */}
                <div
                    className="w-full h-1 rounded-full mb-3 cursor-pointer"
                    style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                >
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: 'var(--primary-main)'
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (videoRef.current) {
                                    isPlaying ? videoRef.current.pause() : videoRef.current.play();
                                }
                            }}
                            className="p-2 rounded-full transition-colors"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-white" />
                            ) : (
                                <Play className="w-5 h-5 text-white" />
                            )}
                        </button>

                        <button
                            onClick={() => {
                                if (videoRef.current) {
                                    videoRef.current.muted = !isMuted;
                                    setIsMuted(!isMuted);
                                }
                            }}
                            className="p-2 rounded-full transition-colors"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                            {isMuted ? (
                                <VolumeX className="w-5 h-5 text-white" />
                            ) : (
                                <Volume2 className="w-5 h-5 text-white" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 rounded-full transition-colors"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                            <Settings className="w-5 h-5 text-white" />
                        </button>

                        <button
                            onClick={() => {
                                if (videoRef.current) {
                                    videoRef.current.requestFullscreen();
                                }
                            }}
                            className="p-2 rounded-full transition-colors"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        >
                            <Maximize className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
