import { createClient, createAdminClient } from '@/lib/supabase/server';
import { SimplePermissionManager } from '@/components/admin/SimplePermissionManager';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Shield, UserX, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function UserManagePage({ params }: Props) {
  const { userId } = await params;
  const adminSupabase = await createAdminClient();

  // Get user details
  const { data: user, error: userError } = await adminSupabase.auth.admin.getUserById(userId);
  
  if (userError || !user.user) {
    notFound();
  }

  // Get user enrollments
  const { data: enrollments, error: enrollmentsError } = await adminSupabase
    .from('enrollments')
    .select(`
      *,
      portals:portal_id (
        id,
        name,
        image_url
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  // Get all portals for permission management
  const { data: portals, error: portalsError } = await adminSupabase
    .from('portals')
    .select('*')
    .eq('is_active', true)
    .order('name');

  // Get all modules for permission management
  const { data: modules, error: modulesError } = await adminSupabase
    .from('modules')
    .select('*')
    .eq('is_active', true)
    .order('portal_id, order_index');

  // Get user access logs (recent activity)
  const { data: accessLogs, error: logsError } = await adminSupabase
    .from('access_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const userData = user.user;
  const isDisabled = false; // We'll implement this properly later

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/users"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para lista de alunos
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl">
                  {(userData.user_metadata?.name || userData.email || '').charAt(0).toUpperCase()}
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userData.user_metadata?.name || 'Sem nome'}
                    </h1>
                    {userData.user_metadata?.role === 'admin' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                        <Shield className="w-4 h-4 mr-1" />
                        Administrador
                      </span>
                    )}
                    {isDisabled && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <UserX className="w-4 h-4 mr-1" />
                        Conta Inativa
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {userData.email}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Cadastrado em {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {userData.last_sign_in_at && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Último acesso: {new Date(userData.last_sign_in_at).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="text-right">
                <div className="text-2xl font-bold text-pink-600">
                  {enrollments?.length || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(enrollments?.length || 0) === 1 ? 'Portal' : 'Portais'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Enrollments Overview */}
        {enrollments && enrollments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Matrículas Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {enrollment.portals?.image_url ? (
                      <img
                        src={enrollment.portals.image_url}
                        alt={enrollment.portals.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                        {enrollment.portals?.name?.charAt(0) || 'P'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {enrollment.portals?.name || 'Portal'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {enrollment.permissions?.access_all ? 'Acesso completo' : `${enrollment.permissions?.allowed_modules?.length || 0} módulos`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Matriculado em {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                    {enrollment.expires_at && (
                      <div className="mt-1">
                        Expira em {new Date(enrollment.expires_at).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permission Management */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gerenciar Permissões</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <SimplePermissionManager
              userId={userId}
              userEmail={userData.email || ''}
              initialPortals={portals || []}
              initialEnrollments={enrollments || []}
            />
          </div>
        </div>

        {/* Recent Activity */}
        {accessLogs && accessLogs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Atividade Recente</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4">
                {accessLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getActionLabel(log.action)}
                      </div>
                      {log.details && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {JSON.stringify(log.details, null, 2).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    'login': 'Login realizado',
    'logout': 'Logout realizado',
    'view_content': 'Conteúdo visualizado',
    'complete_lesson': 'Aula concluída',
    'start_lesson': 'Aula iniciada',
    'comment_created': 'Comentário criado',
    'chat_message': 'Mensagem enviada',
    'enrollment_created': 'Matrícula criada',
    'enrollment_updated': 'Matrícula atualizada',
  };
  
  return labels[action] || action;
}