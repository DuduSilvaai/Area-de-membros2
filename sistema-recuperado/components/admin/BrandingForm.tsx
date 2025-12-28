'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Portal } from '@/types/enrollment';
import { Loader2, Save, Image as ImageIcon, Palette, Mail, Layout, Type, Laptop, Smartphone, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BrandingFormProps {
    portal: Portal;
}

export function BrandingForm({ portal }: BrandingFormProps) {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        primary_color: portal.settings?.primary_color || '#FF2D78',
        secondary_color: portal.settings?.secondary_color || '#1f2937',
        logo_url: portal.settings?.logo_url || '',
        favicon_url: portal.settings?.favicon_url || '',
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
            const { error } = await supabase
                .from('portals')
                .update({ settings })
                .eq('id', portal.id);

            if (error) throw error;

            toast.success('Configurações salvas!');
            router.refresh();
        } catch (error) {
            console.error('Error saving branding:', error);
            toast.error('Erro ao salvar.');
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ label, value, onChange, icon: Icon, placeholder, type = "text" }: any) => (
        <div className="flex flex-col gap-2">
            <label className="text-[#A1A1AA] text-sm font-medium ml-1">
                {label}
            </label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#FF2D78] transition-colors">
                    {Icon && <Icon className="w-5 h-5" />}
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full h-[52px] bg-[#27272A] border border-[#52525B] text-white rounded-xl focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none transition-all placeholder:text-zinc-600 ${Icon ? 'pl-12' : 'pl-4'} pr-4`}
                />
            </div>
        </div>
    );

    const ColorPicker = ({ label, value, onChange }: any) => (
        <div className="flex flex-col gap-2">
            <label className="text-[#A1A1AA] text-sm font-medium ml-1">
                {label}
            </label>
            <div className="flex items-center gap-3">
                <div
                    className="w-[52px] h-[52px] rounded-xl border border-[#52525B] shadow-sm flex-shrink-0 relative overflow-hidden ring-1 ring-black/20"
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">#</span>
                    <input
                        type="text"
                        value={value.replace('#', '')}
                        onChange={(e) => onChange(`#${e.target.value.replace('#', '')}`)}
                        className="w-full h-[52px] bg-[#27272A] border border-[#52525B] text-white rounded-xl focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none transition-all pl-8 uppercase font-mono"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start pb-32">

                {/* LEFT COLUMN: EDITOR (Inputs) */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Visual Identity */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-[#FF2D78]" />
                            Identidade Visual
                        </h3>

                        <div className="space-y-5">
                            <InputField
                                label="URL do Logotipo"
                                value={settings.logo_url}
                                onChange={(v: string) => handleChange('logo_url', v)}
                                icon={ImageIcon}
                                placeholder="https://exemplo.com/logo.png"
                            />
                            <InputField
                                label="URL do Favicon"
                                value={settings.favicon_url}
                                onChange={(v: string) => handleChange('favicon_url', v)}
                                icon={Type}
                                placeholder="https://exemplo.com/favicon.ico"
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
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
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-[#FF2D78]" />
                            Suporte
                        </h3>

                        <InputField
                            label="Email de Suporte"
                            value={settings.support_email}
                            onChange={(v: string) => handleChange('support_email', v)}
                            icon={Mail}
                            type="email"
                            placeholder="suporte@seucurso.com"
                        />
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
                                <div className="ml-4 flex-1 h-5 bg-zinc-800 rounded-md opacity-50" />
                            </div>

                            {/* Viewport Content */}
                            <div className="bg-zinc-50 relative min-h-[500px] flex flex-col">

                                {/* Hero Section Mock */}
                                <div className="h-44 bg-zinc-200 relative overflow-hidden shrink-0">
                                    {portal.image_url ? (
                                        <img src={portal.image_url} className="w-full h-full object-cover" alt="" />
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
                                        className="w-20 h-20 rounded-xl shadow-lg border-2 border-white bg-white flex items-center justify-center overflow-hidden"
                                        style={{ backgroundColor: settings.secondary_color }}
                                    >
                                        {settings.logo_url ? (
                                            <img src={settings.logo_url} className="w-12 h-12 object-contain" alt="" />
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
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-xl border-t border-white/10 z-50 flex justify-end items-center gap-4">
                <span className="text-zinc-400 text-sm hidden md:block">
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
