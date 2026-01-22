'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Portal } from '@/types/enrollment';
import { Loader2, Save, Image as ImageIcon, Laptop } from 'lucide-react';
import { updatePortalSettings } from '@/app/(admin)/portals/actions';
import { useRouter } from 'next/navigation';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface BrandingFormProps {
    portal: Portal;
}

export function BrandingForm({ portal }: BrandingFormProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const [settings, setSettings] = useState({
        banner_url: portal.settings?.banner_url || '',
        // Keep these for potential backward compatibility or if the backend expects them, 
        // but currently we essentially ignore editing them.
        primary_color: portal.settings?.primary_color || '#FF2D78',
        secondary_color: portal.settings?.secondary_color || '#1f2937',
    });

    const router = useRouter();

    const handleChange = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // We use the same update function, but we only really changed the banner_url 
            // from the UI perspective.
            const result = await updatePortalSettings(portal.id, {
                name: portal.name,
                description: portal.description || '',
                settings: {
                    ...portal.settings, // Keep existing settings we don't expose anymore
                    banner_url: settings.banner_url,
                }
            });

            if (result.error) throw new Error(result.error);

            toast.success('Capa do portal atualizada com sucesso!');
            router.refresh();
        } catch (error: any) {
            console.error('Error saving branding:', error);
            toast.error(error.message || 'Erro ao salvar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-[600px]">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start pb-32">

                {/* LEFT COLUMN: EDITOR (Inputs) */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Visual Identity - NOW JUST BANNER */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-pink-500/5 to-purple-600/5 dark:from-pink-500/10 dark:to-purple-600/10 p-6 rounded-3xl border border-pink-500/10 dark:border-pink-500/20">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-2">
                                <ImageIcon className="w-5 h-5 text-[#FF2D78]" />
                                Capa do Portal
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                                Esta imagem será o destaque visual principal da sua área de membros. Escolha algo que represente bem a identidade do seu curso.
                            </p>

                            <ImageUploader
                                label="Upload da Imagem"
                                imageUrl={settings.banner_url}
                                setImageUrl={(url) => handleChange('banner_url', url)}
                                uploading={uploadingBanner}
                                setUploading={setUploadingBanner}
                                helpText="Recomendado: 1200x300 pixels. Formatos: JPG, PNG."
                                previewHeight="h-48"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW (Live Component) */}
                <div className="lg:col-span-3 flex justify-center pt-8 lg:pt-0">
                    <div className="lg:sticky lg:top-8 w-full flex flex-col items-center">

                        <div className="mb-8">
                            <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 text-[#A1A1AA] text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                <Laptop className="w-3 h-3" />
                                Preview em tempo real
                            </div>
                        </div>

                        {/* LIVE PREVIEW - Fixed width to prevent squashing */}
                        <div className="relative group">
                            {/* Decorative background/border container with fixed width */}
                            <div className="w-[350px] md:w-[400px] p-8 rounded-[2.5rem] bg-zinc-900/5 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex justify-center shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 overflow-hidden relative transition-all duration-500 hover:border-pink-500/20">
                                {/* Decorative gradient */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 via-transparent to-purple-500/5 opacity-50" />

                                <div className="transform transition-transform duration-500 group-hover:scale-105 relative z-10">
                                    <FakeCourseCard
                                        course={{
                                            id: 'preview',
                                            title: portal.name || 'Nome do Portal',
                                            thumbnail: settings.banner_url || null,
                                            progress: 45,
                                            author: 'Sua Escola',
                                            total_lessons: 12
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[300px] mx-auto leading-relaxed">
                                Assim que o aluno verá seu portal na biblioteca.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* STICKY BOTTOM BAR */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#121216]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-50 flex justify-end items-center gap-4">
                <span className="text-gray-500 dark:text-zinc-400 text-sm hidden md:block animate-pulse">
                    Alterações pendentes...
                </span>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-[#FF2D78] hover:bg-[#d61c5e] text-white rounded-full font-bold shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
}

// DUPLICATED from members/CourseCard.tsx to ensure perfect preview without import issues across app/routes
import { PlayCircle } from 'lucide-react';
const FakeCourseCard = ({ course }: { course: any }) => {
    return (
        <div className="group relative flex-shrink-0 w-full sm:w-[300px] md:w-[350px] cursor-default select-none">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-md">
                {/* Image */}
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover opacity-90"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-white/20" />
                    </div>
                )}
                {/* Progress Bar (Always visible) */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                    <div
                        className="h-full bg-[#FF0080] shadow-[0_0_10px_#FF0080]"
                        style={{ width: `${course.progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="mt-4 px-1">
                <h3 className="text-zinc-900 dark:text-white font-serif font-bold text-lg truncate drop-shadow-sm">
                    {course.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-gray-300 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded border border-white/10">
                        {course.progress}% Concluído
                    </span>
                    {course.total_lessons && (
                        <p className="text-zinc-500 dark:text-gray-400 text-sm font-light">• {course.total_lessons} aulas</p>
                    )}
                </div>
            </div>
        </div>
    );
};
