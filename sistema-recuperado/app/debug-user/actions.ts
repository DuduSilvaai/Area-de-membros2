'use server';

import { createAdminClient } from '../../lib/supabase/server';

export async function debugUserAccess(userEmail: string) {
    const adminSupabase = await createAdminClient();

    try {
        console.log('=== DEBUGGING USER ACCESS ===');
        console.log('User email:', userEmail);

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

        // 2. Get all enrollments for this user
        const { data: allEnrollments, error: enrollError } = await adminSupabase
            .from('enrollments')
            .select('*')
            .eq('user_id', targetUser.id);

        console.log('All enrollments:', allEnrollments);

        // 3. Get active enrollments only
        const activeEnrollments = allEnrollments?.filter(e => e.is_active) || [];
        console.log('Active enrollments:', activeEnrollments);

        // 4. Get all portals
        const { data: allPortals, error: portalsError } = await adminSupabase
            .from('portals')
            .select('*');

        console.log('All portals:', allPortals);

        // 5. Get active portals only
        const activePortals = allPortals?.filter(p => p.is_active) || [];
        console.log('Active portals:', activePortals);

        // 6. Get portal IDs from enrollments
        const enrolledPortalIds = activeEnrollments.map(e => e.portal_id);
        console.log('Enrolled portal IDs:', enrolledPortalIds);

        // 7. Get enrolled portals (what should appear)
        const enrolledPortals = activePortals.filter(p => enrolledPortalIds.includes(p.id));
        console.log('Enrolled portals (should appear):', enrolledPortals);

        // 8. Simulate members page query
        let membersPageResult: any[] = [];
        if (enrolledPortalIds.length > 0) {
            const { data: memberPortals, error: memberError } = await adminSupabase
                .from('portals')
                .select('*')
                .in('id', enrolledPortalIds)
                .eq('is_active', true)
                .order('name');
            
            console.log('Members page query result:', memberPortals);
            console.log('Members page query error:', memberError);
            
            if (memberError) {
                return { error: `Members page query error: ${memberError.message}` };
            }
            
            membersPageResult = memberPortals || [];
        }

        // 9. Check for issues
        const issues: string[] = [];
        
        // Check if enrolled portals are active
        activeEnrollments.forEach(enrollment => {
            const portal = allPortals?.find(p => p.id === enrollment.portal_id);
            if (!portal) {
                issues.push(`Enrollment ${enrollment.id} references non-existent portal ${enrollment.portal_id}`);
            } else if (!portal.is_active) {
                issues.push(`Enrollment ${enrollment.id} references inactive portal "${portal.name}" (${portal.id})`);
            }
        });

        // Check for duplicate enrollments
        const portalCounts = enrolledPortalIds.reduce((acc: any, id) => {
            acc[id] = (acc[id] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(portalCounts).forEach(([portalId, count]) => {
            if ((count as number) > 1) {
                issues.push(`Multiple active enrollments for portal ${portalId} (${count} enrollments)`);
            }
        });

        return {
            success: true,
            data: {
                user: {
                    id: targetUser.id,
                    email: targetUser.email,
                    created_at: targetUser.created_at
                },
                allEnrollments: allEnrollments || [],
                activeEnrollments: activeEnrollments,
                allPortals: allPortals || [],
                activePortals: activePortals,
                enrolledPortalIds: enrolledPortalIds,
                enrolledPortals: enrolledPortals,
                membersPageResult: membersPageResult,
                issues: issues,
                summary: {
                    totalEnrollments: allEnrollments?.length || 0,
                    activeEnrollments: activeEnrollments.length,
                    totalPortals: allPortals?.length || 0,
                    activePortals: activePortals.length,
                    expectedPortals: enrolledPortals.length,
                    actualPortals: membersPageResult.length,
                    issuesFound: issues.length
                }
            }
        };

    } catch (error) {
        console.error('Debug error:', error);
        return { error: `Unexpected error: ${error}` };
    }
}