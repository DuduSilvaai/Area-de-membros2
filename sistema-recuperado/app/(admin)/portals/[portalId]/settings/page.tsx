'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Settings, Palette, Headphones, Upload, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/UIComponents';
import { getPortal, updatePortalSettings, getPresignedUrl } from '@/app/(admin)/admin/actions';
import { toast } from 'sonner';

type TabType = 'branding' | 'info' | 'support';

interface PortalSettings {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    logo_dark_url?: string;
    banner_url?: string;
    favicon_url?: string;
    support_email?: string;
    support_whatsapp?: string;
    theme_mode?: 'light' | 'dark';
}

interface Portal {
    id: string;
    name: string;
    description: string | null;
    settings: PortalSettings | null;
}

// Helper Components
const ImageUploader = ({
    label,
    helpText,
    imageUrl,
    setImageUrl,
    uploading,
    setUploading,
    aspectRatio = 'auto',
    previewHeight = 'h-24',
}: {
    label: string;
    helpText?: string;
    imageUrl: string;
    setImageUrl: (url: string) => void;
    uploading: boolean;
    setUploading: (val: boolean) => void;
    aspectRatio?: string;
    previewHeight?: string;
}) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <div className="flex items-start gap-4">
            {imageUrl ? (
                <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={label}
                        className={`${previewHeight} w-auto max-w-xs object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-2`}
                    />
                    <button
                        onClick={() => setImageUrl('')}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <label className={`flex flex-col items-center justify-center ${previewHeight} w-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-200`}>
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    ) : (
                        <>
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 text-center px-2">Clique para enviar</span>
                        </>
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
            {helpText && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>{helpText}</p>
                </div>
            )}
        </div>
    </div>
);

const ColorPicker = ({
    label,
    color,
    setColor,
}: {
    label: string;
    color: string;
    setColor: (color: string) => void;
}) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
        </label>
        <div className="flex items-center gap-3">
            <div className="relative">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-14 h-14 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-gray-600 p-1 bg-white dark:bg-gray-800"
                />
            </div>
            <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 uppercase font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="#6366F1"
            />
        </div>
    </div>
);

export default function PortalSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const portalId = params.portalId as string;

    const [activeTab, setActiveTab] = useState<TabType>('branding');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Upload states
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingLogoDark, setUploadingLogoDark] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#6366F1');
    const [secondaryColor, setSecondaryColor] = useState('#8B5CF6');
    const [bannerUrl, setBannerUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoDarkUrl, setLogoDarkUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [supportWhatsapp, setSupportWhatsapp] = useState('');
    const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        async function loadPortal() {
            setIsLoading(true);
            try {
                const result = await getPortal(portalId);
                if (result.error) {
                    toast.error(result.error);
                    return;
                }
                if (result.portal) {
                    const portal = result.portal as Portal;
                    setName(portal.name || '');
                    setDescription(portal.description || '');

                    const settings = (portal.settings as any) || {};
                    setPrimaryColor(settings.primary_color || '#6366F1');
                    setSecondaryColor(settings.secondary_color || '#8B5CF6');
                    setBannerUrl(settings.banner_url || '');
                    setLogoUrl(settings.logo_url || '');
                    setLogoDarkUrl(settings.logo_dark_url || '');
                    setFaviconUrl(settings.favicon_url || '');
                    setSupportEmail(settings.support_email || '');
                    setSupportWhatsapp(settings.support_whatsapp || '');
                    setThemeMode(settings.theme_mode || 'dark');
                }
            } catch (error) {
                toast.error('Erro ao carregar portal');
            } finally {
                setIsLoading(false);
            }
        }
        loadPortal();
    }, [portalId]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }

        setIsSaving(true);
        try {
            const result = await updatePortalSettings(portalId, {
                name: name.trim(),
                description: description.trim(),
                settings: {
                    primary_color: primaryColor,
                    secondary_color: secondaryColor,
                    banner_url: bannerUrl,
                    logo_url: logoUrl,
                    logo_dark_url: logoDarkUrl,
                    favicon_url: faviconUrl,
                    support_email: supportEmail.trim(),
                    support_whatsapp: supportWhatsapp.trim(),
                    theme_mode: themeMode,
                },
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Configurações salvas com sucesso!');
            }
        } catch (error) {
            toast.error('Erro ao salvar configurações');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'branding' as TabType, label: 'Identidade Visual', icon: Palette },
        { id: 'info' as TabType, label: 'Informações Básicas', icon: Settings },
        { id: 'support' as TabType, label: 'Suporte', icon: Headphones },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                    <p className="text-gray-500 dark:text-gray-400">Carregando configurações...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
            <div className="container mx-auto p-6 max-w-5xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push(`/portals/${portalId}`)}
                                className="p-2.5 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all duration-200 shadow-sm border border-gray-200 dark:border-gray-700"
                                title="Voltar para o Portal"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        Configurações do Portal
                                    </h1>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Personalize a identidade visual e informações do seu portal
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 shadow-lg shadow-indigo-500/25"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-1 mb-8 p-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-xl transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden">

                    {/* ABA 1: IDENTIDADE VISUAL (Branding) */}
                    {activeTab === 'branding' && (
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-3 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                    <Palette className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        Identidade Visual
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Personalize a aparência do seu portal
                                    </p>
                                </div>
                            </div>

                            {/* Banner Upload */}
                            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                <ImageUploader
                                    label="🖼️ Capa do Portal (Banner)"
                                    helpText="Recomendado: 1200x300 pixels. Aparecerá no topo da área de membros."
                                    imageUrl={bannerUrl}
                                    setImageUrl={setBannerUrl}
                                    uploading={uploadingBanner}
                                    setUploading={setUploadingBanner}
                                    previewHeight="h-32"
                                />
                            </div>

                            {/* Logo Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <ImageUploader
                                        label="📷 Logo (Versão Clara)"
                                        helpText="Para fundos claros. PNG com transparência."
                                        imageUrl={logoUrl}
                                        setImageUrl={setLogoUrl}
                                        uploading={uploadingLogo}
                                        setUploading={setUploadingLogo}
                                    />
                                </div>
                                <div className="p-6 bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-700">
                                    <ImageUploader
                                        label="🌙 Logo (Versão Escura)"
                                        helpText="Para fundos escuros. PNG com transparência."
                                        imageUrl={logoDarkUrl}
                                        setImageUrl={setLogoDarkUrl}
                                        uploading={uploadingLogoDark}
                                        setUploading={setUploadingLogoDark}
                                    />
                                </div>
                            </div>

                            {/* Favicon */}
                            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <ImageUploader
                                    label="⭐ Favicon"
                                    helpText="Ícone que aparece na aba do navegador. Recomendado: 32x32 pixels."
                                    imageUrl={faviconUrl}
                                    setImageUrl={setFaviconUrl}
                                    uploading={uploadingFavicon}
                                    setUploading={setUploadingFavicon}
                                    previewHeight="h-16"
                                />
                            </div>

                            {/* Colors */}
                            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                                    🎨 Cores do Portal
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ColorPicker
                                        label="Cor Primária"
                                        color={primaryColor}
                                        setColor={setPrimaryColor}
                                    />
                                    <ColorPicker
                                        label="Cor Secundária"
                                        color={secondaryColor}
                                        setColor={setSecondaryColor}
                                    />
                                </div>

                                {/* Preview */}
                                <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Pré-visualização:</p>
                                    <div className="flex gap-4">
                                        <div
                                            className="flex-1 h-14 rounded-xl flex items-center justify-center text-white font-medium shadow-lg transition-transform hover:scale-105"
                                            style={{ backgroundColor: primaryColor }}
                                        >
                                            Botão Primário
                                        </div>
                                        <div
                                            className="flex-1 h-14 rounded-xl flex items-center justify-center text-white font-medium shadow-lg transition-transform hover:scale-105"
                                            style={{ backgroundColor: secondaryColor }}
                                        >
                                            Botão Secundário
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Theme Mode */}
                            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    🌓 Tema Padrão
                                </h4>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setThemeMode('light')}
                                        className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${themeMode === 'light'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <span className="text-3xl mb-2 block">☀️</span>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Modo Claro</p>
                                    </button>
                                    <button
                                        onClick={() => setThemeMode('dark')}
                                        className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${themeMode === 'dark'
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <span className="text-3xl mb-2 block">🌙</span>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Modo Escuro</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA 2: INFORMAÇÕES BÁSICAS */}
                    {activeTab === 'info' && (
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-3 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        Informações Básicas
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Dados essenciais do portal
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nome do Portal *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Ex: Curso de Marketing Digital"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                                        placeholder="Descreva o que seu portal oferece..."
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Uma boa descrição ajuda seus alunos a entenderem o valor do conteúdo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA 3: SUPORTE */}
                    {activeTab === 'support' && (
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-3 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                                    <Headphones className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                        Informações de Suporte
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Como seus alunos podem entrar em contato
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        📧 Email de Suporte
                                    </label>
                                    <input
                                        type="email"
                                        value={supportEmail}
                                        onChange={(e) => setSupportEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        placeholder="suporte@seudominio.com"
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Este email será exibido para os alunos entrarem em contato.
                                    </p>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                        💬 Link do WhatsApp / Telegram
                                    </label>
                                    <input
                                        type="url"
                                        value={supportWhatsapp}
                                        onChange={(e) => setSupportWhatsapp(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                        placeholder="https://wa.me/5511999999999"
                                    />
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                        Use o formato: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">https://wa.me/SEUNUMERO</code> (com código do país)
                                    </p>
                                </div>

                                {/* Preview Card */}
                                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800/50">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-3">
                                        📱 Prévia do Card de Suporte
                                    </p>
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-100 dark:border-gray-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Precisa de ajuda?</p>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {supportEmail || 'suporte@exemplo.com'}
                                        </p>
                                        {supportWhatsapp && (
                                            <a
                                                href={supportWhatsapp}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                                            >
                                                💬 Falar no WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Save Button for Mobile */}
                <div className="fixed bottom-6 right-6 md:hidden">
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 shadow-2xl shadow-indigo-500/40 rounded-full"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
