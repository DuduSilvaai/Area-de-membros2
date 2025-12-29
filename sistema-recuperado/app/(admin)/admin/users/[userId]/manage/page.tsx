import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PermissionManager } from '@/components/admin/PermissionManager';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{
        userId: string;
    }>;
}

export default async function ManageUserPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { userId } = resolvedParams;

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Verify admin access
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
        redirect('/login');
    }

    // 1. Fetch User
    const { data: { user: targetUser }, error: userError } = await adminSupabase.auth.admin.getUserById(userId);

    if (userError || !targetUser) {
        console.error('Error fetching user:', userError);
        return (
            <div className="p-8 text-center text-red-600">
                Usuário não encontrado
            </div>
        );
    }

    // 2. Fetch Portals
    const { data: portals } = await adminSupabase
        .from('portals')
        .select('*')
        .eq('is_active', true)
        .order('name');

    // 3. Fetch Modules
    const { data: modules } = await adminSupabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

    // 4. Fetch Enrollments
    const { data: enrollments } = await adminSupabase
        .from('enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link
                    href="/admin/users"
                    className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Voltar para Lista de Alunos
                </Link>

                {/* Permission Manager */}
                <PermissionManager
                    userId={userId}
                    userEmail={targetUser.email || 'Email não disponível'}
                    initialPortals={(portals || []) as import('@/types/enrollment').Portal[]}
                    initialModules={modules || []}
                    initialEnrollments={enrollments || []}
                />
            </div>
        </div>
    );
}
