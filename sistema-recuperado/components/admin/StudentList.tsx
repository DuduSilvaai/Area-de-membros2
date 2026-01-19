'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Users, Mail, Calendar, Search, Plus, Loader2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface StudentListProps {
    portalId: string;
}

interface EnrolledUser {
    id: string; // enrollment id
    user_id: string;
    enrolled_at: string;
    user: {
        email: string;
        raw_user_meta_data: any;
    }
}

export function StudentList({ portalId }: StudentListProps) {
    const [students, setStudents] = useState<EnrolledUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [emailToEnroll, setEmailToEnroll] = useState('');

    const supabase = createClient();

    const fetchStudents = async () => {
        setLoading(true);
        try {
            console.log('Fetching students for portalId:', portalId);
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
            id,
            user_id,
            created_at
        `)
                .eq('portal_id', portalId);

            if (error) throw error;

            const mapped = (data as any)?.map((e: any) => ({
                id: e.id,
                user_id: e.user_id,
                enrolled_at: e.created_at,
                user: {
                    email: `franqueado_${e.user_id.substring(0, 4)}@exemplo.com`,
                    raw_user_meta_data: {}
                }
            })) || [];

            setStudents(mapped);
        } catch (error: any) {
            console.error('Error fetching students (RAW):', JSON.stringify(error, null, 2));
            toast.error(`Erro ao carregar franqueados: ${error.message || JSON.stringify(error) || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [portalId]);

    const handleManualEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailToEnroll) return;

        setIsEnrolling(true);
        try {
            toast.info('Simulação: Convite enviado!');
            await new Promise(r => setTimeout(r, 1000));
            setEmailToEnroll('');
            toast.success('Franqueado matriculado com sucesso!');
        } catch (error) {
            toast.error('Erro ao matricular');
        } finally {
            setIsEnrolling(false);
        }
    };

    return (
        <div className="bg-[#18181B] rounded-2xl border border-[#27272A] p-6 md:p-8 space-y-6 min-h-[500px]">

            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-end md:items-center">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#FF2D78]" />
                        Base de Franqueados
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        Gerencie quem tem acesso ao conteúdo.
                    </p>
                </div>

                <form onSubmit={handleManualEnroll} className="flex gap-3 w-full md:w-auto items-center">
                    <input
                        type="email"
                        placeholder="Novo franqueado por email"
                        value={emailToEnroll}
                        onChange={(e) => setEmailToEnroll(e.target.value)}
                        className="flex-1 md:w-64 h-12 bg-[#27272A] border border-[#52525B] text-white rounded-xl focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none px-4 text-sm transition-all placeholder:text-zinc-600"
                    />
                    <button
                        type="submit"
                        disabled={isEnrolling || !emailToEnroll}
                        className="h-12 px-6 bg-[#FF2D78] hover:bg-[#d61c5e] text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/10 transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                    >
                        {isEnrolling ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4 mr-2" />}
                        Matricular
                    </button>
                </form>
            </div>

            <hr className="border-zinc-800" />

            {/* Filter */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#FF2D78] transition-colors" />
                <input
                    type="text"
                    placeholder="Filtrar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-[#27272A] border border-[#52525B] text-white rounded-xl focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none transition-all placeholder:text-zinc-600"
                />
            </div>

            {/* Student List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FF2D78]" />
                    </div>
                ) : students.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-[#52525B] rounded-2xl bg-[#27272A]/30">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-600">
                            <Users className="w-8 h-8" />
                        </div>
                        <p className="text-zinc-400 font-bold text-lg">Nenhum franqueado encontrado</p>
                        <p className="text-sm text-zinc-600 mt-1">Sua base de franqueados está vazia.</p>
                    </div>
                ) : (
                    students.map((student) => (
                        <div key={student.id} className="group bg-[#27272A] p-4 rounded-xl border border-zinc-800 hover:border-[#FF2D78]/40 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs">
                                    {student.user.email.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-zinc-100">{student.user.email}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="text-xs text-zinc-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(student.enrolled_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                                            Ativo
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
