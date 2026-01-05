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
}: ImageUploaderProps) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const processFile = async (file: File) => {
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
            // Ensure we handle potentially null/undefined process.env in client (though unlikely for public var)
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/course-content/${result.path}`;

            setImageUrl(publicUrl);
            toast.success('Imagem enviada com sucesso!');
        } catch (error: any) {
            toast.error(`Erro no upload: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-3 w-full" >
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
                    <label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            flex flex-col items-center justify-center w-full h-full
                            border-2 border-dashed 
                            ${isDragging ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50'}
                            rounded-xl cursor-pointer 
                            hover:border-pink-500 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 
                            transition-all duration-200 group
                        `}
                    >
                        {uploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-pink-500 transition-colors">
                                <div className={`p-3 rounded-full shadow-sm transition-all ${isDragging ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-500' : 'bg-white dark:bg-zinc-800 group-hover:shadow-md'}`}>
                                    <Upload className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">{isDragging ? 'Solte para enviar' : 'Clique ou arraste para enviar'}</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) processFile(file);
                            }}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>
        </div >
    );
};
