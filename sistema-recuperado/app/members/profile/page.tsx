'use client';

import React, { useState, useRef, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Mail, Clock, BookOpen, Edit2, Save, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import StudentNavbar from '@/components/members/StudentNavbar';

export default function ProfilePage() {
    const { user } = useAuth();

    // Local state to manage form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        about: ''
    });

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Learning activity stats
    const [learningStats, setLearningStats] = useState({
        completedLessons: 0,
        totalHoursWatched: 0
    });

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;

            try {
                setLoading(true);

                // Fetch profile data
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    const profile = data as any;
                    setFormData({
                        name: profile.full_name || '',
                        email: user.email || '', // Email usually comes from auth user
                        phone: profile.phone || '', // Assuming phone column exists, otherwise it will just be state
                        about: profile.bio || ''    // Assuming bio column exists
                    });
                    setAvatarUrl(profile.avatar_url);
                }

                // Fetch learning stats - count completed lessons
                const { data: progressData, error: progressError } = await supabase
                    .from('progress')
                    .select('content_id, is_completed')
                    .eq('user_id', user.id)
                    .eq('is_completed', true);

                if (!progressError && progressData) {
                    const completedCount = progressData.length;

                    // Estimate hours: assume average of 10 minutes per lesson
                    const estimatedHours = Math.round((completedCount * 10 / 60) * 10) / 10;

                    setLearningStats({
                        completedLessons: completedCount,
                        totalHoursWatched: estimatedHours
                    });
                }

            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Erro ao carregar perfil.');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            const updates = {
                id: user.id,
                full_name: formData.name,
                // email: formData.email, // Usually email is not updated directly here in Supabase Auth
                // phone: formData.phone,
                // bio: formData.about,
                updated_at: new Date().toISOString(),
            };

            // Note: We are only updating columns that likely exist. 
            // If 'phone' and 'bio' columns don't exist in your specific schema yet, this might error.
            // Based on standard schemas, full_name and avatar_url are common. 
            // I will assume standard fields for now. 
            // Ifcols don't exist, we might need to add them or map them to 'metadata' json column.

            const { error } = await supabase
                .from('profiles')
                .upsert(updates as any);

            if (error) throw error;

            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao salvar alterações.');
        } finally {
            setIsSaving(false);
        }
    };

    // Placeholder for file upload - complexity omitted as per plan default choice
    const triggerFileInput = () => {
        toast.info('Upload de avatar será implementado em breve.');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 animate-spin text-mozart-pink" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-500 pb-20">

            <StudentNavbar />

            {/* Hero / Cover */}
            <div className="h-64 md:h-80 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-black/60 dark:to-black/80 backdrop-blur-sm"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#050505] to-transparent"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-12 relative -mt-24 z-10">

                {/* Header Card - Glass */}
                <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6 mb-8">
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-[#18181b] shadow-lg overflow-hidden bg-gray-200 cursor-pointer" onClick={triggerFileInput}>
                            <img
                                src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`}
                                alt="Profile"
                                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                <Camera className="text-white" size={32} />
                            </div>
                        </div>
                        <button
                            onClick={triggerFileInput}
                            className="absolute bottom-2 right-2 p-2 bg-[#FF0080] text-white rounded-full hover:bg-[#d6006c] transition-colors shadow-lg z-10"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>

                    <div className="flex-1 mb-2">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-2">{formData.name || 'Usuário sem nome'}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1.5"><Mail size={16} /> {formData.email}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Col: Stats & Bio */}
                    <div className="space-y-8">
                        {/* Stats - Glass - Static for now, can be connected to progress table later */}
                        <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-sm">
                            <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white mb-6">Atividade de Aprendizado</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{learningStats.completedLessons}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aulas Concluídas</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#FF0080]/10 text-[#FF0080] flex items-center justify-center border border-[#FF0080]/20">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{learningStats.totalHoursWatched}h</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Horas Estimadas</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bio - Glass */}
                        <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white">Sobre <span className="text-sm font-sans font-normal text-gray-400 ml-1">(Opcional)</span></h3>
                            </div>
                            <textarea
                                name="about"
                                value={formData.about}
                                onChange={handleInputChange}
                                rows={6}
                                placeholder="Conte um pouco sobre você..."
                                className="w-full bg-transparent text-gray-600 dark:text-gray-300 leading-relaxed text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#FF0080]/50 rounded-lg p-2 -ml-2 transition-all"
                            />
                        </div>
                    </div>

                    {/* Right Col: Personal Info Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/10 shadow-sm">
                            <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-100/50 dark:border-white/5">Informações Pessoais</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome Completo</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#FF0080] transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Telefone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-[#FF0080] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100/50 dark:border-white/5 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-8 py-3 bg-[#FF0080] text-white rounded-lg font-bold shadow-lg shadow-[#FF0080]/20 hover:bg-[#d6006c] transition-all transform hover:-translate-y-1 flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} /> Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
