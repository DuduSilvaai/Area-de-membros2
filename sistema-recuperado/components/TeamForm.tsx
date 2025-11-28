'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Save, Settings, Users, Shield, MessageSquare } from 'lucide-react';
import { Button, Input, Select, Switch, FileUpload } from './UIComponents';
import { createPortal } from '@/app/(admin)/admin/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- SCHEMA DE VALIDAÇÃO (Baseado no código recuperado) ---
const schema = yup.object().shape({
    name: yup.string().required('O nome é obrigatório').min(3, 'Mínimo de 3 caracteres'),
    description: yup.string().required('Descrição obrigatória').min(10, 'Mínimo de 10 caracteres').max(500),
    support_email: yup.string().email('Email inválido').required('Email de suporte obrigatório'),
    support_external_url: yup.string().url('URL inválida').nullable(),
    theme: yup.string().required(),
    is_external_domain: yup.number(),
    // Configurações de tema
    theme_settings: yup.object().shape({
        default_color: yup.string(),
        light_logo_url: yup.string().nullable(),
        dark_logo_url: yup.string().nullable(),
    }),
    // Configurações de comentários
    comments_settings: yup.object().shape({
        day_limit: yup.number().min(0).max(200),
        character_limit: yup.number().min(10).max(999),
        automatically_publish: yup.boolean(),
    })
});

// --- COMPONENTE DO FORMULÁRIO ---
export default function TeamForm() {
    const [activeTab, setActiveTab] = useState('data');
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Hook do Formulário
    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            name: '',
            description: '',
            support_email: '',
            support_external_url: '',
            theme: 'modern',
            is_external_domain: 0,
            theme_settings: {
                default_color: '#FFD900',
                light_logo_url: null,
                dark_logo_url: null,
            },
            comments_settings: {
                day_limit: 10,
                character_limit: 255,
                automatically_publish: false,
            }
        }
    });

    const onSubmit = async (data: any) => {
        setIsSaving(true);

        try {
            const result = await createPortal(data);

            if (result.error) {
                toast.error(result.error);
                console.error(result.error);
            } else {
                toast.success('Portal criado com sucesso!');
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Erro inesperado ao criar portal');
        } finally {
            setIsSaving(false);
        }
    };

    // Observa valores para preview
    const themeColor = watch('theme_settings.default_color');

    return (
        <div className="w-full">
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Criar Novo Time</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" type="button">Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
                        <Save className="w-4 h-4" /> Salvar Alterações
                    </Button>
                </div>
            </div>

            {/* Abas de Navegação */}
            <div className="flex border-b border-gray-200 mb-6 gap-6">
                {[
                    { id: 'data', label: 'Dados Básicos', icon: Settings },
                    { id: 'style', label: 'Aparência', icon: Users }, // Ícone ilustrativo
                    { id: 'comments', label: 'Comentários', icon: MessageSquare },
                    { id: 'access', label: 'Acesso & Domínio', icon: Shield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600 font-semibold'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTEÚDO DO FORMULÁRIO */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* --- ABA 1: DADOS BÁSICOS --- */}
                {activeTab === 'data' && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700">
                        <Input label="Nome do Time" {...register('name')} error={errors.name?.message} placeholder="Ex: Time de Vendas" />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                            <textarea
                                {...register('description')}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-black dark:text-white dark:bg-gray-800"
                                rows={3}
                                placeholder="Descreva o propósito deste time..."
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Email de Suporte" {...register('support_email')} error={errors.support_email?.message} />
                            <Input label="URL Externa de Suporte" {...register('support_external_url')} error={errors.support_external_url?.message} />
                        </div>
                    </div>
                )}

                {/* --- ABA 2: APARÊNCIA --- */}
                {activeTab === 'style' && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 space-y-4">
                        <Select
                            label="Tema do Portal"
                            {...register('theme')}
                            options={[
                                { label: 'Moderno', value: 'modern' },
                                { label: 'Flix (Claro)', value: 'flix.light' },
                                { label: 'Flix (Escuro)', value: 'flix.dark' },
                            ]}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Cor Padrão (Hex)"
                                type="color"
                                className="h-12 cursor-pointer"
                                {...register('theme_settings.default_color')}
                            />
                            <div className="flex items-center pt-6">
                                <span className="text-sm dark:text-gray-300">Cor selecionada: <strong>{themeColor}</strong></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Controller
                                name="theme_settings.light_logo_url"
                                control={control}
                                render={({ field }) => (
                                    <FileUpload
                                        label="Logo (Versão Clara)"
                                        onFileSelect={(file) => field.onChange(file ? URL.createObjectURL(file) : null)}
                                        previewUrl={field.value || undefined}
                                    />
                                )}
                            />
                            <Controller
                                name="theme_settings.dark_logo_url"
                                control={control}
                                render={({ field }) => (
                                    <FileUpload
                                        label="Logo (Versão Escura)"
                                        onFileSelect={(file) => field.onChange(file ? URL.createObjectURL(file) : null)}
                                        previewUrl={field.value || undefined}
                                    />
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* --- ABA 3: COMENTÁRIOS --- */}
                {activeTab === 'comments' && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Limite Diário de Comentários" type="number" {...register('comments_settings.day_limit')} />
                            <Input label="Limite de Caracteres" type="number" {...register('comments_settings.character_limit')} />
                        </div>

                        <Controller
                            name="comments_settings.automatically_publish"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    label="Publicar comentários automaticamente?"
                                    checked={field.value || false}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                )}

                {/* --- ABA 4: ACESSO --- */}
                {activeTab === 'access' && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-700">
                        <Controller
                            name="is_external_domain"
                            control={control}
                            render={({ field }) => (
                                <div className="flex gap-4 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                        <input type="radio" value={0} checked={Number(field.value) === 0} onChange={() => field.onChange(0)} />
                                        Domínio Ticto
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                                        <input type="radio" value={1} checked={Number(field.value) === 1} onChange={() => field.onChange(1)} />
                                        Domínio Próprio (Externo)
                                    </label>
                                </div>
                            )}
                        />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Configure aqui se o portal usará um subdomínio nosso ou um domínio seu.</p>
                    </div>
                )}

            </form>
        </div>
    );
}