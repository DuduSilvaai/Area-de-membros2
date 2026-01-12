import { createClient, createAdminClient } from '@/lib/supabase/server';
import { UserListClient } from '@/components/admin/UserListClient';
import { StudentManagementDashboard } from '@/components/admin/StudentManagementDashboard';

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

  // Calculate dashboard stats
  const totalStudents = users?.length || 0;
  const activeStudents = users?.filter(u => !u.banned_until || new Date(u.banned_until) <= new Date()).length || 0;
  const inactiveStudents = totalStudents - activeStudents;
  const totalEnrollments = enrollments?.length || 0;
  const studentsWithAccess = users?.filter(u => 
    enrollments?.some(e => e.user_id === u.id)
  ).length || 0;
  const studentsWithoutAccess = totalStudents - studentsWithAccess;
  
  // Calculate recent enrollments (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentEnrollments = enrollments?.filter(e => 
    new Date(e.enrolled_at) >= sevenDaysAgo
  ).length || 0;

  const dashboardStats = {
    totalStudents,
    activeStudents,
    inactiveStudents,
    totalEnrollments,
    studentsWithAccess,
    studentsWithoutAccess,
    recentEnrollments,
    completionRate: 78 // This would come from actual completion data
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard */}
        <div className="mb-8">
          <StudentManagementDashboard stats={dashboardStats} />
        </div>

        {/* User Management */}
        <UserListClient
          users={users || []}
          enrollments={enrollments || []}
          portals={portals || []}
        />
      </div>
    </div>
  );
}