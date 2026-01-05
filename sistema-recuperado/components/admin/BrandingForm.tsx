'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Portal } from '@/types/enrollment';
import { Loader2, Save, Image as ImageIcon, Palette, Mail, Layout, Type, Laptop, Smartphone, Check } from 'lucide-react';
import { updatePortalSettings } from '@/app/(admin)/portals/actions';
import { useRouter } from 'next/navigation';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface BrandingFormProps {
    portal: Portal;
}

export function BrandingForm({ portal }: BrandingFormProps) {
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const [settings, setSettings] = useState({
        primary_color: portal.settings?.primary_color || '#FF2D78',
        secondary_color: portal.settings?.secondary_color || '#1f2937',
        logo_url: portal.settings?.logo_url || '',
        favicon_url: portal.settings?.favicon_url || '',
        banner_url: portal.settings?.banner_url || '',
        support_email: portal.settings?.support_email || '',
    });

    const router = useRouter();
    const supabase = createClient();

    const handleChange = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updatePortalSettings(portal.id, {
                name: portal.name, // Preserve existing name
                description: portal.description || '', // Preserve existing description
                settings: {
                    ...settings,
                    theme_mode: portal.settings?.theme_mode || 'dark' // Preserve theme mode
                }
            });

            if (result.error) throw new Error(result.error);

            toast.success('Configurações salvas!');
            router.refresh();
        } catch (error: any) {
            console.error('Error saving branding:', error);
            toast.error(error.message || 'Erro ao salvar.');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start pb-32">

                {/* LEFT COLUMN: EDITOR (Inputs) */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Visual Identity */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-[#FF2D78]" />
                            Identidade Visual
                        </h3>

                        <div className="space-y-5">
                            <ImageUploader
                                label="Capa do Portal (Banner)"
                                imageUrl={settings.banner_url}
                                setImageUrl={(url) => handleChange('banner_url', url)}
                                uploading={uploadingBanner}
                                setUploading={setUploadingBanner}
                                helpText="Recomendado: 1200x300 pixels. Aparecerá no topo da área de membros."
                                previewHeight="h-32"
                            />
                            <ImageUploader
                                label="Logotipo"
                                imageUrl={settings.logo_url}
                                setImageUrl={(url) => handleChange('logo_url', url)}
                                uploading={uploadingLogo}
                                setUploading={setUploadingLogo}
                                helpText="PNG com fundo transparente. Ideal para fundos escuros."
                                darkBackground={true}
                            />
                            <ImageUploader
                                label="Favicon"
                                imageUrl={settings.favicon_url}
                                setImageUrl={(url) => handleChange('favicon_url', url)}
                                uploading={uploadingFavicon}
                                setUploading={setUploadingFavicon}
                                helpText="Ícone do navegador (32x32px)"
                                previewHeight="h-32"
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Palette className="w-5 h-5 text-[#FF2D78]" />
                            Tema e Cores
                        </h3>

                        <div className="grid grid-cols-1 gap-5">
                            <ColorPicker
                                label="Cor Primária (Destaque)"
                                value={settings.primary_color}
                                onChange={(v: string) => handleChange('primary_color', v)}
                            />
                            <ColorPicker
                                label="Cor Secundária (Fundo/Base)"
                                value={settings.secondary_color}
                                onChange={(v: string) => handleChange('secondary_color', v)}
                            />
                        </div>
                    </div>

                    {/* Support */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-[#FF2D78]" />
                            Suporte
                        </h3>

                        <div className="flex flex-col gap-2">
                            <label className="text-gray-500 dark:text-[#A1A1AA] text-sm font-medium ml-1">
                                Email de Suporte
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 group-focus-within:text-[#FF2D78] transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={settings.support_email}
                                    onChange={(e) => handleChange('support_email', e.target.value)}
                                    placeholder="suporte@seucurso.com"
                                    className="w-full h-[52px] bg-white dark:bg-[#27272A] border border-gray-200 dark:border-[#52525B] text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 pl-12 pr-4"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW (Mockup) */}
                <div className="lg:col-span-3">
                    <div className="lg:sticky lg:top-8">

                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-[#A1A1AA] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                <Laptop className="w-4 h-4" />
                                Visualização do Aluno
                            </div>
                        </div>

                        {/* DEVICE MOCKUP */}
                        <div className="relative rounded-2xl bg-zinc-950 shadow-2xl shadow-black overflow-hidden border-[8px] border-zinc-900 ring-1 ring-white/10">
                            {/* Browser Bar */}
                            <div className="h-9 bg-[#18181B] flex items-center px-4 gap-2 border-b border-white/5">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                                <div className="w-3 h-3 rounded-full bg-[#28C840]" />

                                {/* Address Bar with Favicon */}
                                <div className="ml-4 flex-1 h-5 bg-zinc-800 rounded-md opacity-50 flex items-center px-2 gap-2">
                                    {settings.favicon_url && (
                                        <img
                                            src={settings.favicon_url}
                                            alt="Favicon"
                                            className="w-3 h-3 object-contain"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Viewport Content */}
                            <div className="bg-zinc-50 relative min-h-[500px] flex flex-col">

                                {/* Hero Section Mock */}
                                <div className="h-44 bg-zinc-200 relative overflow-hidden shrink-0">
                                    {settings.banner_url ? (
                                        <img src={settings.banner_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                            <ImageIcon className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                </div>

                                {/* Floating Logo + Action */}
                                <div className="px-8 -mt-10 flex justify-between items-end relative z-10 mb-6">
                                    <div
                                        className="w-20 h-20 rounded-xl shadow-lg border-2 border-white bg-white flex items-center justify-center overflow-hidden p-1"
                                        style={{ backgroundColor: settings.secondary_color }}
                                    >
                                        {settings.logo_url ? (
                                            <img src={settings.logo_url} className="w-full h-full object-contain" alt="Logo" />
                                        ) : (
                                            <span className="text-[10px] text-white/80 font-bold">LOGO</span>
                                        )}
                                    </div>
                                    <button
                                        className="px-6 py-2.5 text-xs font-bold text-white rounded-full shadow-lg transform translate-y-4 hover:scale-105 transition"
                                        style={{ backgroundColor: settings.primary_color }}
                                    >
                                        ACESSAR AULAS
                                    </button>
                                </div>

                                {/* Mock Body */}
                                <div className="px-8 space-y-6">
                                    <div className="space-y-2">
                                        <div className="h-6 w-1/3 bg-zinc-200 rounded animate-pulse" />
                                        <div className="h-4 w-2/3 bg-zinc-100 rounded animate-pulse" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="aspect-video bg-white rounded-lg shadow-sm border border-zinc-100 p-3 space-y-2">
                                                <div className="w-full h-2/3 bg-zinc-100 rounded-md" />
                                                <div className="h-2 w-1/2 bg-zinc-100 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* STICKY BOTTOM BAR */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-[#121216]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-50 flex justify-end items-center gap-4">
                <span className="text-gray-500 dark:text-zinc-400 text-sm hidden md:block">
                    Não esqueça de salvar suas alterações
                </span>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3 bg-[#FF2D78] hover:bg-[#d61c5e] text-white rounded-full font-bold shadow-lg shadow-pink-500/20 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
}



const ColorPicker = ({ label, value, onChange }: any) => (
    <div className="flex flex-col gap-2">
        <label className="text-gray-500 dark:text-[#A1A1AA] text-sm font-medium ml-1">
            {label}
        </label>
        <div className="flex items-center gap-3">
            <div
                className="w-[52px] h-[52px] rounded-xl border border-gray-200 dark:border-[#52525B] shadow-sm flex-shrink-0 relative overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                style={{ backgroundColor: value }}
            >
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 opacity-0"
                />
            </div>
            <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500">#</span>
                <input
                    type="text"
                    value={value.replace('#', '')}
                    onChange={(e) => onChange(`#${e.target.value.replace('#', '')}`)}
                    className="w-full h-[52px] bg-white dark:bg-[#27272A] border border-gray-200 dark:border-[#52525B] text-zinc-900 dark:text-white rounded-xl focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none transition-all pl-8 uppercase font-mono"
                />
            </div>
        </div>
    </div>
);
