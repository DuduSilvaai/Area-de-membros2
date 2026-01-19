'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestPereira() {
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('pereiragaminho@games.com');

    const testUserAccess = async () => {
        setLoading(true);
        
        try {
            console.log('=== TESTING USER ACCESS ===');
            
            // Since we can't use admin functions from client, let's test with current user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setResults({ error: 'Please log in first' });
                setLoading(false);
                return;
            }
            
            console.log('Current user:', user.id, user.email);
            
            // Test the same logic as members page
            const { data: userEnrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('portal_id, permissions, enrolled_at')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('enrolled_at', { ascending: false });

            console.log('User enrollments:', userEnrollments, 'Error:', enrollError);

            if (enrollError) {
                setResults({ error: `Enrollment error: ${enrollError.message}` });
                setLoading(false);
                return;
            }

            if (!userEnrollments || userEnrollments.length === 0) {
                setResults({
                    user: { id: user.id, email: user.email },
                    message: 'No active enrollments found',
                    userEnrollments: [],
                    portalIds: [],
                    portals: []
                });
                setLoading(false);
                return;
            }

            // Get portal IDs from enrollments
            const portalIds = userEnrollments.map(e => e.portal_id);
            console.log('Portal IDs from enrollments:', portalIds);

            // Fetch portals by IDs with fresh data (same as members page)
            const { data: portalData, error: portalError } = await supabase
                .from('portals')
                .select('*')
                .in('id', portalIds)
                .eq('is_active', true)
                .order('name');

            console.log('Fetched portals:', portalData, 'Error:', portalError);

            if (portalError) {
                setResults({ error: `Portal error: ${portalError.message}` });
                setLoading(false);
                return;
            }

            // Also get all portals for comparison
            const { data: allPortals } = await supabase
                .from('portals')
                .select('*');

            setResults({
                user: { id: user.id, email: user.email },
                userEnrollments: userEnrollments,
                portalIds: portalIds,
                portals: portalData || [],
                allPortals: allPortals || [],
                expectedCount: portalIds.length,
                actualCount: (portalData || []).length
            });
            
        } catch (error) {
            console.error('Test error:', error);
            setResults({ error: `Unexpected error: ${error}` });
        } finally {
            setLoading(false);
        }
    };

    const testSpecificUser = async () => {
        setLoading(true);
        
        try {
            // Test by looking up enrollments by email pattern
            // This is a workaround since we can't use admin functions from client
            
            // First, let's see all enrollments to understand the data
            const { data: allEnrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('*');
            
            console.log('All enrollments in system:', allEnrollments);
            
            // Get all portals
            const { data: allPortals, error: portalsError } = await supabase
                .from('portals')
                .select('*');
            
            console.log('All portals in system:', allPortals);
            
            setResults({
                message: `Found ${allEnrollments?.length || 0} total enrollments and ${allPortals?.length || 0} total portals`,
                allEnrollments: allEnrollments || [],
                allPortals: allPortals || [],
                activeEnrollments: allEnrollments?.filter(e => e.is_active) || [],
                activePortals: allPortals?.filter(p => p.is_active) || []
            });
            
        } catch (error) {
            console.error('Test error:', error);
            setResults({ error: `Unexpected error: ${error}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Test User Access
                </h1>

                <div className="mb-6 flex gap-4">
                    <button
                        onClick={testUserAccess}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Testing...' : 'Test Current User'}
                    </button>
                    
                    <button
                        onClick={testSpecificUser}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Testing...' : 'View All Data'}
                    </button>
                </div>

                {results.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                        <pre className="text-red-700 text-sm">{results.error}</pre>
                    </div>
                )}

                {results.message && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h2 className="text-lg font-semibold text-blue-800 mb-2">Info</h2>
                        <p className="text-blue-700">{results.message}</p>
                    </div>
                )}

                {results.user && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">User Info</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{results.userEnrollments?.length || 0}</div>
                                <div className="text-sm text-gray-600">Active Enrollments</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{results.expectedCount || 0}</div>
                                <div className="text-sm text-gray-600">Expected Portals</div>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${results.actualCount === results.expectedCount ? 'text-green-600' : 'text-red-600'}`}>
                                    {results.actualCount || 0}
                                </div>
                                <div className="text-sm text-gray-600">Actual Portals</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{results.allPortals?.length || 0}</div>
                                <div className="text-sm text-gray-600">Total Portals</div>
                            </div>
                        </div>
                    </div>
                )}

                {(results.allEnrollments || results.userEnrollments) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Enrollments */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">
                                {results.userEnrollments ? 'User Enrollments' : 'All Active Enrollments'} 
                                ({(results.userEnrollments || results.activeEnrollments)?.length || 0})
                            </h2>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(results.userEnrollments || results.activeEnrollments)?.map((enrollment: any) => (
                                    <div key={enrollment.id} className="border border-gray-200 rounded p-3 text-sm">
                                        <div><strong>Portal ID:</strong> {enrollment.portal_id}</div>
                                        <div><strong>User ID:</strong> {enrollment.user_id}</div>
                                        <div><strong>Active:</strong> {enrollment.is_active ? 'Yes' : 'No'}</div>
                                        <div><strong>Enrolled:</strong> {new Date(enrollment.enrolled_at).toLocaleString()}</div>
                                    </div>
                                )) || <div className="text-gray-500">No enrollments</div>}
                            </div>
                        </div>

                        {/* Portals */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">
                                {results.portals ? 'User Portals' : 'All Active Portals'} 
                                ({(results.portals || results.activePortals)?.length || 0})
                            </h2>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(results.portals || results.activePortals)?.map((portal: any) => (
                                    <div key={portal.id} className="border border-green-200 bg-green-50 rounded p-3 text-sm">
                                        <div><strong>Name:</strong> {portal.name}</div>
                                        <div><strong>ID:</strong> {portal.id}</div>
                                        <div><strong>Active:</strong> {portal.is_active ? 'Yes' : 'No'}</div>
                                    </div>
                                )) || <div className="text-gray-500">No portals</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Raw Data */}
                {Object.keys(results).length > 0 && !results.error && (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Raw Data</h2>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-64">
                            {JSON.stringify(results, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Instructions:</h3>
                    <ol className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                        <li>1. <strong>Test Current User:</strong> Tests the same logic as the members page for the currently logged-in user</li>
                        <li>2. <strong>View All Data:</strong> Shows all enrollments and portals in the system for debugging</li>
                        <li>3. Log in as the user "pereiragaminho@games.com" and click "Test Current User" to see their specific data</li>
                        <li>4. Compare the expected vs actual portal counts to identify issues</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}