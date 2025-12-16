import { createClient, createAdminClient } from '@/lib/supabase/server';
import { UserListClient } from '@/components/admin/UserListClient';

export default async function UsersPage() {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();

  // Fetch users using Admin API (server-side)
  // This requires the SERVICE_ROLE_KEY which is used in createAdminClient
  const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-red-600">Erro ao carregar usuários</h3>
        <p className="text-sm text-gray-500 mt-2">{usersError.message}</p>
      </div>
    );
  }

  // Fetch enrollments
  // We can use the regular client here if RLS allows admins to see all enrollments,
  // or use adminSupabase to be sure. Let's use adminSupabase to guarantee access.
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
    .eq('is_active', true);

  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError);
  }

  // Fetch all portals for filter
  const { data: portals, error: portalsError } = await adminSupabase
    .from('portals')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (portalsError) {
    console.error('Error fetching portals:', portalsError);
  }

  return (
    <UserListClient
      users={users || []}
      enrollments={enrollments || []}
      portals={portals || []}
    />
  );
}