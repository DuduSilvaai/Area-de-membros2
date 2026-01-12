'use server';

import { createAdminClient } from '../../lib/supabase/server';

export async function createMissingEnrollments(userEmail: string) {
    const adminSupabase = await createAdminClient();

    try {
        console.log('=== CREATING MISSING ENROLLMENTS ===');
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

        // 2. Get all portals
        const { data: allPortals, error: portalsError } = await adminSupabase
            .from('portals')
            .select('*')
            .eq('is_active', true);

        if (portalsError) {
            return { error: `Error fetching portals: ${portalsError.message}` };
        }

        console.log('Found portals:', allPortals?.map(p => ({ id: p.id, name: p.name })));

        // 3. Get existing enrollments
        const { data: existingEnrollments, error: enrollError } = await adminSupabase
            .from('enrollments')
            .select('*')
            .eq('user_id', targetUser.id);

        console.log('Existing enrollments:', existingEnrollments?.map(e => ({ id: e.id, portal_id: e.portal_id, is_active: e.is_active })));

        // 4. Find missing enrollments
        const existingPortalIds = existingEnrollments?.filter(e => e.is_active).map(e => e.portal_id) || [];
        const missingPortals = allPortals?.filter(p => !existingPortalIds.includes(p.id)) || [];

        console.log('Missing portals:', missingPortals.map(p => ({ id: p.id, name: p.name })));

        if (missingPortals.length === 0) {
            return { 
                success: true, 
                message: 'No missing enrollments found. User already has access to all portals.',
                data: {
                    existingEnrollments: existingEnrollments?.length || 0,
                    missingEnrollments: 0
                }
            };
        }

        // 5. Create missing enrollments
        const newEnrollments = missingPortals.map(portal => ({
            user_id: targetUser.id,
            portal_id: portal.id,
            permissions: {
                access_all: true,
                allowed_modules: [],
                access_granted_at: new Date().toISOString()
            },
            is_active: true,
            enrolled_at: new Date().toISOString()
        }));

        console.log('Creating enrollments:', newEnrollments);

        const { data: createdEnrollments, error: createError } = await adminSupabase
            .from('enrollments')
            .insert(newEnrollments)
            .select();

        if (createError) {
            console.error('Error creating enrollments:', createError);
            return { error: `Error creating enrollments: ${createError.message}` };
        }

        console.log('Created enrollments:', createdEnrollments);

        return {
            success: true,
            message: `Successfully created ${createdEnrollments?.length || 0} missing enrollments`,
            data: {
                existingEnrollments: existingEnrollments?.length || 0,
                createdEnrollments: createdEnrollments?.length || 0,
                totalEnrollments: (existingEnrollments?.length || 0) + (createdEnrollments?.length || 0),
                createdFor: missingPortals.map(p => p.name)
            }
        };

    } catch (error) {
        console.error('Unexpected error:', error);
        return { error: `Unexpected error: ${error}` };
    }
}

export async function deleteAllEnrollments(userEmail: string) {
    const adminSupabase = await createAdminClient();

    try {
        // Find user
        const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
        const targetUser = users?.find(u => u.email === userEmail);
        
        if (!targetUser) {
            return { error: `User with email ${userEmail} not found` };
        }

        // Delete all enrollments
        const { data, error } = await adminSupabase
            .from('enrollments')
            .delete()
            .eq('user_id', targetUser.id)
            .select();

        if (error) {
            return { error: `Error deleting enrollments: ${error.message}` };
        }

        return {
            success: true,
            message: `Deleted ${data?.length || 0} enrollments`,
            data: { deletedCount: data?.length || 0 }
        };

    } catch (error) {
        return { error: `Unexpected error: ${error}` };
    }
}