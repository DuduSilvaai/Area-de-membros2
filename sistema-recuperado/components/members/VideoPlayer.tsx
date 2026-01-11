'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
    // New props
    videoUrl?: string;
    poster?: string;
    onEnded?: () => void;
    // Legacy props for backward compatibility
    url?: string;
    autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    poster,
    onEnded,
    url,
    autoPlay = false
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');

    const defaultPoster = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

    // Handle both url and videoUrl props
    const actualVideoUrl = videoUrl || url;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            const prog = (video.currentTime / video.duration) * 100;
            setProgress(prog);
            setCurrentTime(formatTime(video.currentTime));
        };

        const handleLoadedMetadata = () => {
            setDuration(formatTime(video.duration));
            if (autoPlay) {
                video.play().catch(() => {
                    // Autoplay blocked, user needs to interact
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            onEnded?.();
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [onEnded, autoPlay]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newProgress = (clickX / width) * 100;
        video.currentTime = (newProgress / 100) * video.duration;
        setProgress(newProgress);
    };

    const handleFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.requestFullscreen) {
            video.requestFullscreen();
        }
    };

    // If no video URL is provided, show placeholder
    if (!actualVideoUrl) {
        return (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl flex items-center justify-center">
                <p className="text-gray-500">Nenhum vídeo disponível</p>
            </div>
        );
    }

    return (
        <div
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl group"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(isPlaying ? false : true)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                src={actualVideoUrl}
                poster={poster || defaultPoster}
                onClick={togglePlay}
                playsInline
            />

            {/* Play Button Overlay (when paused) */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
                    onClick={togglePlay}
                >
                    <div className="w-24 h-24 bg-mozart-pink/90 rounded-full flex items-center justify-center pl-2 hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,0,128,0.5)] backdrop-blur-sm border-4 border-white/10">
                        <Play size={48} fill="white" className="text-white" />
                    </div>
                </div>
            )}

            {/* Custom Controls Overlay */}
            <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/60 to-transparent px-8 py-6 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
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
                        <button className="text-gray-300 hover:text-white text-sm font-semibold flex items-center gap-1 bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-all">
                            <SkipForward size={14} /> 1.5x
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
