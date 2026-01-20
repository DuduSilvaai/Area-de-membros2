'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createMeeting, updateMeeting, Meeting } from '@/app/actions/meetings';
import { Loader2, X, Link as LinkIcon, Upload, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

const meetingSchema = z.object({
    title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
    description: z.string().optional(),
    link: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
    studentId: string;
    meeting?: Meeting | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function MeetingForm({ studentId, meeting, onClose, onSuccess }: MeetingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(meeting?.link || null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<MeetingFormData>({
        resolver: zodResolver(meetingSchema),
        defaultValues: {
            title: meeting?.title || '',
            description: meeting?.description || '',
            link: meeting?.link || '',
        }
    });

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 500MB)
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('Arquivo muito grande. Máximo permitido: 500MB');
            return;
        }

        setIsUploading(true);

        try {
            // 1. Get Signed URL from Server (Admin Privilege)
            const { getMeetingPresignedUrl } = await import('@/app/actions/meetings');
            const result = await getMeetingPresignedUrl(file.name, file.type, studentId);

            if (result.error || !result.signedUrl) {
                throw new Error(result.error || 'Erro ao gerar URL de upload');
            }

            // 2. Upload directly to Storage via PUT (bypassing Client RLS and Next.js limits)
            const uploadResponse = await fetch(result.signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                    'x-upsert': 'false',
                },
            });

            if (!uploadResponse.ok) {
                const text = await uploadResponse.text();
                throw new Error(`Erro no upload (${uploadResponse.status}): ${text}`);
            }

            // 3. Construct Public URL
            const bucketName = result.bucketName || 'meeting-files';
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(result.path!);

            setUploadedFileUrl(urlData.publicUrl);
            setUploadedFileName(file.name);
            setValue('link', urlData.publicUrl);
            toast.success('Arquivo enviado com sucesso!');

        } catch (error: any) {
            console.error('Error uploading file:', error);
            toast.error('Erro no upload: ' + error.message);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleRemoveFile = () => {
        setUploadedFileUrl(null);
        setUploadedFileName(null);
        setValue('link', '');
    };

    const onSubmit = async (data: MeetingFormData) => {
        setIsSubmitting(true);
        try {
            if (meeting) {
                const res = await updateMeeting(meeting.id, data);
                if (res.error) throw new Error(res.error);
                toast.success('Reunião atualizada com sucesso!');
            } else {
                const res = await createMeeting({
                    ...data,
                    student_id: studentId,
                    description: data.description || null,
                    link: data.link || null
                });
                if (res.error) throw new Error(res.error);
                toast.success('Reunião registrada com sucesso!');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao salvar reunião');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
            }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={handleBackdropClick}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-2xl"
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '28rem',
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 rounded-t-2xl">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {meeting ? 'Editar Reunião' : 'Registrar Reunião'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tema da Reunião
                        </label>
                        <input
                            {...register('title')}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                            placeholder="Ex: Alinhamento de Metas"
                        />
                        {errors.title && <span className="text-xs text-red-500">{errors.title.message}</span>}
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Descrição
                        </label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none resize-none"
                            placeholder="Detalhes sobre o que foi discutido..."
                        />
                    </div>

                    {/* File Upload OR Link */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <LinkIcon size={14} />
                            Gravação / Arquivo da Reunião
                        </label>

                        {uploadedFileUrl ? (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700">
                                <FileText size={20} className="text-pink-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 dark:text-white truncate">
                                        {uploadedFileName || 'Arquivo anexado'}
                                    </p>
                                    <a
                                        href={uploadedFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-pink-500 hover:text-pink-600 truncate block"
                                    >
                                        Ver arquivo
                                    </a>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    title="Remover arquivo"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* File Upload Button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl text-gray-500 dark:text-zinc-400 hover:border-pink-500 hover:text-pink-500 dark:hover:border-pink-500 dark:hover:text-pink-500 transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Enviando arquivo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            <span>Fazer upload de arquivo</span>
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
                                />

                                {/* OR divider */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                                    <span className="text-xs text-gray-400 dark:text-zinc-500">ou cole um link</span>
                                    <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
                                </div>

                                {/* Link Input */}
                                <input
                                    {...register('link')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg shadow-lg shadow-pink-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {meeting ? 'Salvar Alterações' : 'Registrar Reunião'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
