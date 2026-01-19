import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { syncUsersProfiles } from './actions';

async function createUserAction(formData: FormData) {
  'use server';

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!name || !email || !password) {
    redirect('/users?error=Todos os campos são obrigatórios');
  }

  const adminSupabase = await createAdminClient();

  try {
    const { data: newUser, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: role === 'admin' ? 'admin' : 'member'
      }
    });

    if (error) {
      redirect(`/users?error=${encodeURIComponent(error.message)}`);
    }

    // Log the action
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
      await adminSupabase.from('access_logs').insert({
        user_id: currentUser.id,
        action: 'create_user',
        details: {
          created_user_id: newUser.user?.id,
          created_user_email: email,
          created_user_role: role
        }
      });
    }

    revalidatePath('/users');
    redirect('/users?success=Usuário criado com sucesso!');
  } catch (error: any) {
    redirect(`/users?error=${encodeURIComponent(error.message || 'Erro ao criar usuário')}`);
  }
}

interface Props {
  searchParams: { success?: string; error?: string };
}

async function syncAction() {
  'use server';
  await syncUsersProfiles();
  redirect('/users?success=Perfis sincronizados com sucesso!');
}

export default async function UsersPageSimple({ searchParams }: Props) {
  try {
    const adminSupabase = await createAdminClient();

    // Fetch users using Admin API
    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar usuários</h1>
          <p className="text-gray-600">{usersError.message}</p>
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Alunos</h1>

          <form action={syncAction}>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar Perfis
            </button>
          </form>
        </div>

        {/* Success/Error Messages */}
        {searchParams.success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{searchParams.success}</p>
          </div>
        )}

        {searchParams.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{searchParams.error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Lista de Usuários ({users?.length || 0})</h2>

          <div className="space-y-4">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {user.user_metadata?.name || 'Sem nome'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.user_metadata?.role === 'admin'
                        ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                        {user.user_metadata?.role === 'admin' ? 'Admin' : 'Aluno'}
                      </span>
                      <a
                        href={`/users/${user.id}/manage`}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Gerenciar
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Simple Create User Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Cadastrar Novo Aluno</h2>
          <form action={createUserAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="joao@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha Inicial
              </label>
              <input
                name="password"
                type="text"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Mínimo 6 caracteres"
              />
              <p className="text-xs text-gray-500 mt-1">Você deve enviar esta senha para o usuário.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Acesso
              </label>
              <select
                name="role"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="member">Aluno (Padrão)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Criar Aluno
            </button>
          </form>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erro Inesperado</h1>
        <p className="text-gray-600">Ocorreu um erro ao carregar a página.</p>
      </div>
    );
  }
}