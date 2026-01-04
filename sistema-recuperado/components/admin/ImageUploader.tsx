import React from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getPresignedUrl } from '@/app/(admin)/admin/actions';

interface ImageUploaderProps {
    label: string;
    helpText?: string;
    imageUrl: string;
    setImageUrl: (url: string) => void;
    uploading: boolean;
    setUploading: (val: boolean) => void;
    aspectRatio?: string;
    previewHeight?: string;
    darkBackground?: boolean;
}

export const ImageUploader = ({
    label,
    helpText,
    imageUrl,
    setImageUrl,
    uploading,
    setUploading,
    // Default height suitable for banners/rectangles
    previewHeight = 'h-32',
}: ImageUploaderProps) => (
    <div className="space-y-3 w-full">
        <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {label}
            </label>
            {helpText && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {helpText}
                </span>
            )}
        </div>

        <div className={`relative w-full ${previewHeight}`}>
            {imageUrl ? (
                <div className="relative w-full h-full group rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={label}
                        className="w-full h-full object-cover bg-gray-50 dark:bg-zinc-900"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <button
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-all transform hover:scale-105 z-10"
                        title="Remover imagem"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <label className={`
                    flex flex-col items-center justify-center w-full h-full
                    border-2 border-dashed border-gray-300 dark:border-zinc-700 
                    bg-gray-50 dark:bg-zinc-900/50 
                    rounded-xl cursor-pointer 
                    hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 
                    transition-all duration-200 group
                `}>
                    {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-indigo-500 transition-colors">
                            <div className="p-3 bg-white dark:bg-zinc-800 rounded-full shadow-sm group-hover:shadow-md transition-all">
                                <Upload className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium">Clique ou arraste para enviar</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const handleUpload = async () => {
                                    if (!file || !file.type.startsWith('image/')) {
                                        return toast.error('Selecione apenas imagens');
                                    }
                                    if (file.size > 5 * 1024 * 1024) {
                                        return toast.error('Imagem deve ter no máximo 5MB');
                                    }

                                    try {
                                        setUploading(true);
                                        const result = await getPresignedUrl(file.name, file.type);

                                        if (result.error || !result.signedUrl) {
                                            throw new Error(result.error || 'Erro ao gerar URL de upload');
                                        }

                                        const uploadResponse = await fetch(result.signedUrl, {
                                            method: 'PUT',
                                            body: file,
                                            headers: { 'Content-Type': file.type },
                                        });

                                        if (!uploadResponse.ok) {
                                            throw new Error(`Erro no upload: ${uploadResponse.statusText}`);
                                        }

                                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                                        const publicUrl = `${supabaseUrl}/storage/v1/object/public/course-content/${result.path}`;

                                        setImageUrl(publicUrl);
                                        toast.success('Imagem enviada com sucesso!');
                                    } catch (error: any) {
                                        toast.error(`Erro no upload: ${error.message}`);
                                    } finally {
                                        setUploading(false);
                                    }
                                };
                                handleUpload();
                            }
                        }}
                        disabled={uploading}
                    />
                </label>
            )}
        </div>
    </div>
);
