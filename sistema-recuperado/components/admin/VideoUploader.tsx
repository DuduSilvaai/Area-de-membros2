'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, X, FileVideo, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploaderProps {
    onUploadComplete: (url: string, duration?: number) => void;
    folderPath?: string;
}

export function VideoUploader({ onUploadComplete, folderPath = 'videos' }: VideoUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('video/')) {
            toast.error('Por favor, selecione um arquivo de vídeo.');
            return;
        }

        // 2GB limit example
        if (file.size > 2 * 1024 * 1024 * 1024) {
            toast.error('O arquivo deve ter no máximo 2GB.');
            return;
        }

        uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setProgress(0);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;

        try {
            // TUS upload would be better for large files, but for now using standard storage upload 
            // Note: Supabase JS client doesn't expose fine-grained progress for standard uploads easily without TUS,
            // but let's simulate or implementation strict upload. 
            // Actually, supabase-js v2 supports progress callback needed? 
            // It seems `upload` doesn't support onProgress in the basic client without TUS. 
            // For this demo, we will use a simulated progress or just a loader if TUS isn't set up.
            // However, if we want "Real progress", we might simply simulate it for user feedback if standard upload is used.

            // Let's implement standard upload for simplicity and robustness first.

            const { data, error } = await supabase.storage
                .from('content-assets') // Make sure this bucket exists
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('content-assets')
                .getPublicUrl(filePath);

            // Attempt to get video duration
            const duration = await getVideoDuration(file);

            onUploadComplete(publicUrl, duration);
            toast.success('Upload concluído com sucesso!');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Erro ao fazer upload: ' + error.message);
            setIsUploading(false); // Only reset on error, or let parent handle success state
        } finally {
            if (!isUploading) {
                // success state handled by component unmount or parent
            } else {
                // keep showing specific state?
                setIsUploading(false);
            }
        }
    };

    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(Math.round(video.duration));
            };
            video.src = URL.createObjectURL(file);
        });
    };

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
          ${isUploading ? 'pointer-events-none opacity-80' : 'cursor-pointer'}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleChange}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center w-full max-w-xs">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-2">Enviando vídeo...</p>
                        {/* Progress bar simulation since basic storage upload doesn't give events */}
                        {/* Ideally we use TUS for real progress on Supabase */}
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Isso pode levar alguns minutos dependendo do tamanho.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                            <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Clique para enviar ou arraste aqui</p>
                        <p className="text-xs text-gray-500 mt-1">MP4, WebM (Max 2GB)</p>
                    </>
                )}
            </div>
        </div>
    );
}
