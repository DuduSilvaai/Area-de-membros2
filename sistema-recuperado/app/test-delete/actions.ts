'use server';

import { createAdminClient } from '../../lib/supabase/server';

export async function testDeleteEnrollment(userEmail: string, portalName: string) {
    const adminSupabase = await createAdminClient();

    try {
        console.log('=== TESTING DELETE ENROLLMENT ===');
        console.log('User email:', userEmail);
        console.log('Portal name:', portalName);

        // 1. Find user by email
        const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
        
        if (usersError) {
            return { error: `Error listing users: ${usersError.message}` };
        }

        const targetUser = users?.find(u => u.email === userEmail);
        
        if (!targetUser) {
            return { error: `User with email ${userEmail} not found` };
        }

        console.log('Found user:', targetUser.id);

        // 2. Find portal by name
        const { data: portals, error: portalsError } = await adminSupabase
            .from('portals')
            .select('*')
            .eq('name', portalName);

        if (portalsError) {
            return { error: `Error fetching portals: ${portalsError.message}` };
        }

        const targetPortal = portals?.find(p => p.name === portalName);
        
        if (!targetPortal) {
            return { error: `Portal with name ${portalName} not found` };
        }

        console.log('Found portal:', targetPortal.id);

        // 3. Check existing enrollment before deletion
        const { data: beforeEnrollments, error: beforeError } = await adminSupabase
            .from('enrollments')
            .select('*')
            .eq('user_id', targetUser.id)
            .eq('portal_id', targetPortal.id);

        console.log('Enrollments before deletion:', beforeEnrollments);

        if (!beforeEnrollments || beforeEnrollments.length === 0) {
            return { 
                success: true,
                message: 'No enrollment found to delete',
                data: {
                    beforeCount: 0,
                    afterCount: 0,
                    deleted: false
                }
            };
        }

        // 4. Delete the enrollment
        const { data: deletedData, error: deleteError } = await adminSupabase
            .from('enrollments')
            .delete()
            .eq('user_id', targetUser.id)
            .eq('portal_id', targetPortal.id)
            .select();

        if (deleteError) {
            console.error('Error deleting enrollment:', deleteError);
            return { error: `Error deleting enrollment: ${deleteError.message}` };
        }

        console.log('Deleted enrollments:', deletedData);

        // 5. Check enrollments after deletion
        const { data: afterEnrollments, error: afterError } = await adminSupabase
            .from('enrollments')
            .select('*')
            .eq('user_id', targetUser.id)
            .eq('portal_id', targetPortal.id);

        console.log('Enrollments after deletion:', afterEnrollments);

        // 6. Check all user enrollments to see current state
        const { data: allUserEnrollments, error: allError } = await adminSupabase
            .from('enrollments')
            .select('*')
            .eq('user_id', targetUser.id);

        console.log('All user enrollments after deletion:', allUserEnrollments);

        return {
            success: true,
            message: `Successfully deleted ${deletedData?.length || 0} enrollment(s)`,
            data: {
                user: { id: targetUser.id, email: targetUser.email },
                portal: { id: targetPortal.id, name: targetPortal.name },
                beforeCount: beforeEnrollments.length,
                afterCount: afterEnrollments?.length || 0,
                deletedCount: deletedData?.length || 0,
                deleted: (deletedData?.length || 0) > 0,
                allUserEnrollments: allUserEnrollments || [],
                deletedEnrollments: deletedData || []
            }
        };

    } catch (error) {
        console.error('Unexpected error:', error);
        return { error: `Unexpected error: ${error}` };
    }
}

export async function testMembersPageQuery(userEmail: string) {
    const adminSupabase = await createAdminClient();

    try {
        // Find user
        const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
        const targetUser = users?.find(u => u.email === userEmail);
        
        if (!targetUser) {
            return { error: `User with email ${userEmail} not found` };
        }

        // Simulate the exact same query as members page
        const { data: userEnrollments, error: enrollError } = await adminSupabase
            .from('enrollments')
            .select('portal_id, permissions, enrolled_at')
            .eq('user_id', targetUser.id)
            .eq('is_active', true)
            .order('enrolled_at', { ascending: false });

        console.log('Members page enrollments query:', userEnrollments);

        if (enrollError) {
            return { error: `Enrollment query error: ${enrollError.message}` };
        }

        if (!userEnrollments || userEnrollments.length === 0) {
            return {
                success: true,
                message: 'No active enrollments found - user should see no portals',
                data: {
                    enrollments: [],
                    portalIds: [],
                    portals: []
                }
            };
        }

        // Get portal IDs from enrollments
        const portalIds = userEnrollments.map(e => e.portal_id);
        console.log('Portal IDs from enrollments:', portalIds);

        // Fetch portals by IDs (same as members page)
        const { data: portalData, error: portalError } = await adminSupabase
            .from('portals')
            .select('*')
            .in('id', portalIds)
            .eq('is_active', true)
            .order('name');

        console.log('Members page portals query:', portalData);

        if (portalError) {
            return { error: `Portal query error: ${portalError.message}` };
        }

        return {
            success: true,
            message: `Members page would show ${portalData?.length || 0} portals`,
            data: {
                enrollments: userEnrollments,
                portalIds: portalIds,
                portals: portalData || []
            }
        };

    } catch (error) {
        return { error: `Unexpected error: ${error}` };
    }
}