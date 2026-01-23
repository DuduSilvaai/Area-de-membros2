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

import { Suspense } from 'react';
import UsersList from '@/components/admin/UsersList';
import { CreateUserForm } from '@/components/admin/CreateUserForm';
import { getPaginatedUsers } from './actions';
import { Loader2 } from 'lucide-react';

async function UsersContent({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params['page'] || 1);
  const search = (params['q'] as string) || '';

  // Fetch initial data using optimized function
  const response = await getPaginatedUsers(page, 20, search);

  return <UsersList initialData={response.data} />;
}

export default function UsersPageSimple({ searchParams }: Props) {
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

      {/* Optimized Users List Component */}
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
            <span className="ml-2 text-gray-500">Carregando usuários...</span>
          </div>
        }
      >
        <UsersContent searchParams={searchParams} />
      </Suspense>

      {/* Dynamic Create User Form */}
      <CreateUserForm />
    </div>
  );
}
