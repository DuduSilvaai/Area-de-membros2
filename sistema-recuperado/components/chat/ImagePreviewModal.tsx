'use client';

import { useEffect, useCallback } from 'react';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    isVideo?: boolean;
}

export function ImagePreviewModal({ isOpen, onClose, url, isVideo = false }: ImagePreviewModalProps) {
    // Handle escape key
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Content */}
            <div
                className="max-w-[90vw] max-h-[90vh] animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {isVideo ? (
                    <video
                        src={url}
                        controls
                        autoPlay
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                    />
                ) : (
                    <img
                        src={url}
                        alt="Preview"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                    />
                )}
            </div>

            {/* Download button */}
            <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
            </a>
        </div>
    );
}
