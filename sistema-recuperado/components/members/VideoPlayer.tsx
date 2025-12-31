'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2, SkipForward, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface VideoPlayerProps {
    videoUrl: string | null;
    title: string;
    lessonId?: string;
    userId?: string;
    initialPosition?: number;
    onComplete?: () => void;
    onNextLesson?: () => void;
    hasNextLesson?: boolean;
}

export default function VideoPlayer({
    videoUrl,
    title,
    lessonId,
    userId,
    initialPosition = 0,
    onComplete,
    onNextLesson,
    hasNextLesson = false
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showNextOverlay, setShowNextOverlay] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastSavedPositionRef = useRef<number>(0);
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

    // Save position to database (debounced)
    const savePosition = useCallback(async (position: number) => {
        if (!lessonId || !userId || position === lastSavedPositionRef.current) return;

        // Only save if position changed by at least 5 seconds
        if (Math.abs(position - lastSavedPositionRef.current) < 5) return;

        lastSavedPositionRef.current = position;

        try {
            await supabase
                .from('progress')
                .upsert({
                    user_id: userId,
                    content_id: lessonId,
                    last_position: Math.floor(position),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,content_id'
                });
        } catch (error) {
            console.error('Error saving position:', error);
        }
    }, [lessonId, userId]);

    // Mark lesson as complete
    const markComplete = useCallback(async () => {
        if (!lessonId || !userId || hasMarkedComplete) return;

        setHasMarkedComplete(true);

        try {
            await supabase
                .from('progress')
                .upsert({
                    user_id: userId,
                    content_id: lessonId,
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                    last_position: 0, // Reset position since completed
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,content_id'
                });

            onComplete?.();
        } catch (error) {
            console.error('Error marking complete:', error);
        }
    }, [lessonId, userId, hasMarkedComplete, onComplete]);

    // Handle video end
    const handleVideoEnd = useCallback(() => {
        markComplete();

        if (hasNextLesson && onNextLesson) {
            setShowNextOverlay(true);
            setCountdown(5);
        }
    }, [markComplete, hasNextLesson, onNextLesson]);

    // Countdown for next lesson
    useEffect(() => {
        if (!showNextOverlay) return;

        if (countdown <= 0) {
            setShowNextOverlay(false);
            onNextLesson?.();
            return;
        }

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [showNextOverlay, countdown, onNextLesson]);

    // Set initial position when video loads
    const handleVideoLoaded = () => {
        setIsLoading(false);
        if (videoRef.current && initialPosition > 0) {
            videoRef.current.currentTime = initialPosition;
        }
    };

    // Handle video progress for direct videos
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            const progressPercent = (currentTime / duration) * 100;
            setProgress(progressPercent);

            // Mark complete when video is 90% watched
            if (progressPercent >= 90 && !hasMarkedComplete) {
                markComplete();
            }
        }
    };

    // Setup position saving interval
    useEffect(() => {
        if (!lessonId || !userId) return;

        // Save position every 30 seconds
        saveIntervalRef.current = setInterval(() => {
            if (videoRef.current && !videoRef.current.paused) {
                savePosition(videoRef.current.currentTime);
            }
        }, 30000);

        return () => {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
            }
            // Save position on unmount
            if (videoRef.current) {
                savePosition(videoRef.current.currentTime);
            }
        };
    }, [lessonId, userId, savePosition]);

    // Reset state when video URL changes
    useEffect(() => {
        setHasMarkedComplete(false);
        setShowNextOverlay(false);
        setCountdown(5);
        lastSavedPositionRef.current = 0;
    }, [videoUrl]);

    const videoType = getVideoType(videoUrl);

    // Cancel auto-advance
    const cancelNextLesson = () => {
        setShowNextOverlay(false);
        setCountdown(5);
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
                onLoadedData={handleVideoLoaded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleVideoEnd}
                controls
            />

            {/* Next Lesson Overlay */}
            {showNextOverlay && (
                <div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    <div className="text-center">
                        <div
                            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
                            style={{
                                backgroundColor: 'var(--primary-main)',
                                boxShadow: '0 0 40px rgba(255, 77, 148, 0.4)'
                            }}
                        >
                            <SkipForward className="w-10 h-10 text-white" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">
                            Próxima aula em {countdown}s...
                        </h3>
                        <p className="text-gray-400 mb-8">
                            Preparando o próximo conteúdo
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={cancelNextLesson}
                                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                            >
                                <X className="w-4 h-4" />
                                Cancelar
                            </button>

                            <button
                                onClick={() => {
                                    setShowNextOverlay(false);
                                    onNextLesson?.();
                                }}
                                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
                                style={{
                                    backgroundColor: 'var(--primary-main)',
                                    color: 'white'
                                }}
                            >
                                <SkipForward className="w-4 h-4" />
                                Ir Agora
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

