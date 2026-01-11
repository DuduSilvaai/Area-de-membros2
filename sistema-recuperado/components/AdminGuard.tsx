'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';

/**
 * AdminGuard - Barreira de segurança no cliente para rotas administrativas.
 * 
 * Este componente verifica se o usuário tem role 'admin'.
 * Se não tiver, redireciona IMEDIATAMENTE para /members.
 * Não renderiza NADA enquanto verifica ou se não autorizado.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const { user, profile, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Aguardar carregamento
        if (isLoading) return;

        // Se não há usuário, deixar o middleware lidar (redireciona para login)
        if (!user) return;

        // BLOQUEIO: Se o usuário NÃO é admin, redirecionar para /members
        if (profile?.role !== 'admin') {
            console.warn('[AdminGuard] Acesso negado - Role:', profile?.role);
            router.replace('/members');
        }
    }, [user, profile, isLoading, router]);

    // Enquanto carrega, mostrar loading
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 text-pink-500 animate-spin" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    // Se não há usuário, não renderizar (middleware vai redirecionar)
    if (!user) {
        return null;
    }

    // BLOQUEIO TOTAL: Se não é admin, não renderizar NADA
    if (profile?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
                <div className="text-center">
                    <ShieldX className="mx-auto h-16 w-16 text-red-500" />
                    <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                        Acesso Restrito
                    </h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Redirecionando para área de membros...
                    </p>
                </div>
            </div>
        );
    }

    // Admin autorizado - renderizar conteúdo
    return <>{children}</>;
}
