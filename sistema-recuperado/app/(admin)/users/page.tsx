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
  searchParams: Promise<{
    success?: string;
    error?: string;
    page?: string;
    q?: string;
  }>;
}

async function syncAction() {
  'use server';
  await syncUsersProfiles();
  redirect('/users?success=Perfis sincronizados com sucesso!');
}

import UsersList from '@/components/admin/UsersList';
import { CreateUserForm } from '@/components/admin/CreateUserForm';
import { getPaginatedUsers } from './actions';

// ... imports remain same ...

export default async function UsersPageSimple({ searchParams }: Props) {
  try {
    const params = await searchParams;
    const page = Number(params['page'] || 1);
    const search = (params['q'] as string) || '';

    // Fetch initial data using optimized function
    const response = await getPaginatedUsers(page, 20, search);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Franqueados</h1>

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
        {params.success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{params.success}</p>
          </div>
        )}

        {params.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{params.error}</p>
          </div>
        )}

        {/* Optimized Users List Component */}
        <UsersList initialData={response.data} />

        {/* Dynamic Create User Form */}
        <CreateUserForm />
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