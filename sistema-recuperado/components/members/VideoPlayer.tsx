'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipForward } from 'lucide-react';

// Use dynamic import for ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface VideoPlayerProps {
    // New props
    videoUrl?: string;
    poster?: string;
    initialTime?: number;
    onEnded?: () => void;
    onProgress?: (time: number) => void;
    // Legacy props for backward compatibility
    url?: string;
    autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    poster,
    initialTime = 0,
    onEnded,
    onProgress,
    url,
    autoPlay = false
}) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [isMounted, setIsMounted] = useState(false); // Fix hydration/SSR issues
    const initialTimeSet = useRef(false);

    const defaultPoster = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Handle both url and videoUrl props
    // Helper to clean YouTube URLs
    const cleanVideoUrl = (inputUrl: string) => {
        if (!inputUrl) return '';
        try {
            // Remove 'si' tracking parameter from YouTube URLs
            if (inputUrl.includes('youtu.be') || inputUrl.includes('youtube.com')) {
                const urlObj = new URL(inputUrl);
                urlObj.searchParams.delete('si');
                return urlObj.toString();
            }
            return inputUrl;
        } catch (e) {
            return inputUrl;
        }
    };

    // Handle both url and videoUrl props with trimming and cleaning
    const actualVideoUrl = cleanVideoUrl((videoUrl || url || '').trim());

    // Debug log para identificar o que está sendo passado
    console.log('[VideoPlayer] URL recebida:', actualVideoUrl);

    // Detectar tipo de vídeo
    const isYouTubeUrl = actualVideoUrl.includes('youtube.com') || actualVideoUrl.includes('youtu.be');
    const isVimeoUrl = actualVideoUrl.includes('vimeo.com');
    console.log('[VideoPlayer] Tipo:', isYouTubeUrl ? 'YouTube' : isVimeoUrl ? 'Vimeo' : 'Outro');

    const formatTime = (seconds: number): string => {
        if (!seconds && seconds !== 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle ready state to set initial time
    const handleReady = () => {
        if (!initialTimeSet.current) {
            if (initialTime > 0 && playerRef.current) {
                playerRef.current.seekTo(initialTime);
            }
            // Safe auto-play trigger
            if (autoPlay) {
                setIsPlaying(true);
            }
            initialTimeSet.current = true;
        }

        // Manual duration fetch to avoid onDuration prop error
        if (playerRef.current) {
            const d = playerRef.current.getDuration();
            if (d) setDuration(formatTime(d));
        }
    };

    // 🛡️ Global Error Suppression for clean UX
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            // Detect "The play() request was interrupted..." errors
            if (
                reason?.name === 'AbortError' ||
                reason?.message?.includes('interrupted') ||
                reason?.message?.includes('call to pause')
            ) {
                event.preventDefault(); // Stop the error from crashing app / showing overlay
                // console.warn('Supressed video playback abort error:', reason);
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

    const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
        setProgress(state.played * 100);
        setCurrentTime(formatTime(state.playedSeconds));
        onProgress?.(state.playedSeconds);

        // Ensure duration is set if it wasn't caught by onDuration
        if (playerRef.current && duration === '0:00') {
            const d = playerRef.current.getDuration();
            if (d) setDuration(formatTime(d));
        }
    };

    const handleDuration = (durationSecs: number) => {
        setDuration(formatTime(durationSecs));
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newProgress = clickX / width; // 0 to 1

        playerRef.current.seekTo(newProgress);
        setProgress(newProgress * 100);
    };

    const handleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    const handleSpeedChange = () => {
        const speeds = [1.0, 1.25, 1.5, 2.0];
        const currentIndex = speeds.indexOf(playbackRate);
        const nextIndex = (currentIndex + 1) % speeds.length;
        setPlaybackRate(speeds[nextIndex]);
    };

    // If no video URL is provided, show placeholder
    if (!actualVideoUrl) {
        return (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl flex items-center justify-center">
                <p className="text-gray-500">Nenhum vídeo disponível</p>
            </div>
        );
    }

    // Prevent hydration mismatch and ensure window is available
    if (!isMounted) {
        return <div className="w-full aspect-video bg-black rounded-xl animate-pulse" />;
    }

    const ReactPlayerAny = ReactPlayer as any;

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(isPlaying ? false : true)}
        >


            {/* React Player Instance */}
            <ReactPlayerAny
                key={actualVideoUrl}
                ref={playerRef}
                url={actualVideoUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                volume={volume}
                muted={isMuted}
                playbackRate={playbackRate}
                light={false} // Desativando light mode para forçar o iframe
                onReady={handleReady}
                onProgress={handleProgress}
                onError={(e: any) => {
                    // Suppress harmless AbortError from rapid play/pause toggles or Chrome autoplay policy
                    if (
                        e?.name === 'AbortError' ||
                        e?.message?.includes('interrupted') ||
                        e?.message?.includes('removed') ||
                        e?.message?.includes('The play() request was interrupted')
                    ) return;

                    console.error('[VideoPlayer] Erro ao carregar vídeo:', e);
                    console.error('[VideoPlayer] URL que falhou:', actualVideoUrl);
                }}

                onEnded={() => {
                    setIsPlaying(false);
                    onEnded?.();
                }}
                config={{
                    youtube: {
                        playerVars: {
                            showinfo: 0,
                            controls: 0,
                            modestbranding: 1,
                            rel: 0,
                            origin: typeof window !== 'undefined' ? window.location.origin : undefined
                        }
                    },
                    vimeo: {
                        playerOptions: { controls: false }
                    },
                    file: {
                        attributes: {
                            poster: poster || defaultPoster,
                            controlsList: 'nodownload'
                        }
                    }
                }}
                style={{ position: 'absolute', top: 0, left: 0 }}
            />

            {/* FALLBACK/DEBUG: Iframe Nativo do YouTube se for YouTube */}
            {actualVideoUrl && (actualVideoUrl.includes('youtu.be') || actualVideoUrl.includes('youtube.com')) && (
                <iframe
                    src={`https://www.youtube.com/embed/${actualVideoUrl.includes('v=') ? actualVideoUrl.split('v=')[1].split('&')[0] : actualVideoUrl.split('/').pop()?.split('?')[0]}`}
                    title="YouTube video player"
                    className="absolute top-0 left-0 w-full h-full z-40"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ pointerEvents: 'auto' }} // Garantir que recebe cliques
                />
            )}

            {/* Play Button Overlay (when paused or buffering) */}
            {/* Play Button Overlay */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                    onClick={() => {
                        setIsPlaying(true);
                    }}
                >
                    <div className="w-24 h-24 bg-mozart-pink/90 rounded-full flex items-center justify-center pl-2 hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,0,128,0.5)] backdrop-blur-sm border-4 border-white/10">
                        <Play size={48} fill="white" className="text-white" />
                    </div>
                </div>
            )}

            {/* Click area to pause/play when playing (invisible layer) */}
            {isPlaying && (
                <div
                    className="absolute inset-0 z-0"
                    onClick={togglePlay}
                />
            )}

            {/* Custom Controls Overlay */}
            <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/60 to-transparent px-8 py-6 transition-opacity duration-300 z-20 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                {/* Progress Bar */}
                <div
                    className="w-full h-1 bg-white/20 rounded-full mb-5 cursor-pointer hover:h-1.5 transition-all group/progress"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-mozart-pink rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_#FF0080] opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="hover:text-mozart-pink transition-colors">
                            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                        </button>
                        <button onClick={toggleMute} className="hover:text-mozart-pink transition-colors">
                            {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                        </button>
                        <span className="text-sm font-medium text-gray-300 tracking-wide font-mono">{currentTime} / {duration}</span>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            onClick={handleSpeedChange}
                            className="text-gray-300 hover:text-white text-sm font-semibold flex items-center gap-1 bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-all w-[70px] justify-center"
                        >
                            <SkipForward size={14} /> {playbackRate}x
                        </button>
                        <button className="text-gray-300 hover:text-white transition-transform hover:rotate-45">
                            <Settings size={22} />
                        </button>
                        <button
                            className="text-gray-300 hover:text-white hover:scale-110 transition-transform"
                            onClick={handleFullscreen}
                        >
                            <Maximize size={22} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
