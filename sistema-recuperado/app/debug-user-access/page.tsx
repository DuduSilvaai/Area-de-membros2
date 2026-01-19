'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugUserAccess() {
    const [userEmail, setUserEmail] = useState('pereiragaminho@games.com');
    const [debugData, setDebugData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const debugUserAccess = async () => {
        if (!userEmail) return;

        setLoading(true);
        const results: any = {
            timestamp: new Date().toISOString(),
            userEmail: userEmail,
            steps: []
        };

        try {
            // Step 1: Find user by email
            results.steps.push({ step: 1, action: 'Finding user by email...' });
            
            const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
            
            if (usersError) {
                results.error = `Error listing users: ${usersError.message}`;
                setDebugData(results);
                setLoading(false);
                return;
            }

            const targetUser = users?.find(u => u.email === userEmail);
            
            if (!targetUser) {
                results.error = `User with email ${userEmail} not found`;
                setDebugData(results);
                setLoading(false);
                return;
            }

            results.user = {
                id: targetUser.id,
                email: targetUser.email,
                created_at: targetUser.created_at
            };
            results.steps.push({ step: 1, result: `Found user: ${targetUser.id}` });

            // Step 2: Get all enrollments for this user
            results.steps.push({ step: 2, action: 'Fetching all enrollments...' });
            
            const { data: allEnrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', targetUser.id);

            results.allEnrollments = allEnrollments || [];
            results.steps.push({ 
                step: 2, 
                result: `Found ${allEnrollments?.length || 0} total enrollments` 
            });

            // Step 3: Get active enrollments only
            const activeEnrollments = allEnrollments?.filter(e => e.is_active) || [];
            results.activeEnrollments = activeEnrollments;
            results.steps.push({ 
                step: 3, 
                result: `Found ${activeEnrollments.length} active enrollments` 
            });

            // Step 4: Get all portals
            results.steps.push({ step: 4, action: 'Fetching all portals...' });
            
            const { data: allPortals, error: portalsError } = await supabase
                .from('portals')
                .select('*');

            results.allPortals = allPortals || [];
            results.steps.push({ 
                step: 4, 
                result: `Found ${allPortals?.length || 0} total portals` 
            });

            // Step 5: Get active portals only
            const activePortals = allPortals?.filter(p => p.is_active) || [];
            results.activePortals = activePortals;
            results.steps.push({ 
                step: 5, 
                result: `Found ${activePortals.length} active portals` 
            });

            // Step 6: Match enrollments with portals
            results.steps.push({ step: 6, action: 'Matching enrollments with portals...' });
            
            const enrolledPortalIds = activeEnrollments.map(e => e.portal_id);
            const enrolledPortals = activePortals.filter(p => enrolledPortalIds.includes(p.id));
            
            results.enrolledPortals = enrolledPortals;
            results.enrolledPortalIds = enrolledPortalIds;
            results.steps.push({ 
                step: 6, 
                result: `User should see ${enrolledPortals.length} portals` 
            });

            // Step 7: Simulate members page query
            results.steps.push({ step: 7, action: 'Simulating members page query...' });
            
            if (activeEnrollments.length > 0) {
                const { data: memberPortals, error: memberError } = await supabase
                    .from('portals')
                    .select('*')
                    .in('id', enrolledPortalIds)
                    .eq('is_active', true)
                    .order('name');

                results.membersPageQuery = {
                    data: memberPortals,
                    error: memberError,
                    query: `portals where id in (${enrolledPortalIds.join(', ')}) and is_active = true`
                };
                results.steps.push({ 
                    step: 7, 
                    result: memberError 
                        ? `Members page query failed: ${memberError.message}`
                        : `Members page query returned ${memberPortals?.length || 0} portals`
                });
            } else {
                results.membersPageQuery = {
                    data: [],
                    error: null,
                    query: 'No active enrollments, so no query needed'
                };
                results.steps.push({ 
                    step: 7, 
                    result: 'No active enrollments, members page would show no portals'
                });
            }

            // Step 8: Check for issues
            results.steps.push({ step: 8, action: 'Analyzing potential issues...' });
            
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
            const portalCounts = enrolledPortalIds.reduce((acc: Record<string, number>, id) => {
                acc[id] = (acc[id] || 0) + 1;
                return acc;
            }, {});
            
            Object.entries(portalCounts).forEach(([portalId, count]) => {
                if ((count as number) > 1) {
                    issues.push(`Multiple active enrollments for portal ${portalId} (${count} enrollments)`);
                }
            });

            results.issues = issues;
            results.steps.push({ 
                step: 8, 
                result: issues.length > 0 
                    ? `Found ${issues.length} potential issues`
                    : 'No issues detected'
            });

            setDebugData(results);

        } catch (error) {
            console.error('Debug error:', error);
            results.error = `Unexpected error: ${error}`;
            setDebugData(results);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        debugUserAccess();
    }, []);

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Debug User Access
                </h1>

                <div className="mb-6 flex gap-4 items-center">
                    <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="User email to debug"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <button
                        onClick={debugUserAccess}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Debugging...' : 'Debug User Access'}
                    </button>
                </div>

                {debugData.timestamp && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Summary</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                                    <div className="text-2xl font-bold text-blue-600">{debugData.allEnrollments?.length || 0}</div>
                                    <div className="text-sm text-blue-800 dark:text-blue-200">Total Enrollments</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded">
                                    <div className="text-2xl font-bold text-green-600">{debugData.activeEnrollments?.length || 0}</div>
                                    <div className="text-sm text-green-800 dark:text-green-200">Active Enrollments</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
                                    <div className="text-2xl font-bold text-purple-600">{debugData.enrolledPortals?.length || 0}</div>
                                    <div className="text-sm text-purple-800 dark:text-purple-200">Available Portals</div>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded">
                                    <div className="text-2xl font-bold text-orange-600">{debugData.issues?.length || 0}</div>
                                    <div className="text-sm text-orange-800 dark:text-orange-200">Issues Found</div>
                                </div>
                            </div>
                        </div>

                        {/* Issues */}
                        {debugData.issues && debugData.issues.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">Issues Detected</h2>
                                <ul className="space-y-2">
                                    {debugData.issues.map((issue: string, index: number) => (
                                        <li key={index} className="text-red-700 dark:text-red-300 flex items-start gap-2">
                                            <span className="text-red-500 mt-1">•</span>
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Steps */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Debug Steps</h2>
                            <div className="space-y-3">
                                {debugData.steps?.map((step: any, index: number) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-sm font-bold">
                                            {step.step}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{step.action || step.result}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Data */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Active Enrollments */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-3">Active Enrollments</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {debugData.activeEnrollments?.map((enrollment: any) => (
                                        <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded p-3 text-sm">
                                            <div><strong>Portal ID:</strong> {enrollment.portal_id}</div>
                                            <div><strong>Enrolled:</strong> {new Date(enrollment.enrolled_at).toLocaleString()}</div>
                                            <div><strong>Active:</strong> {enrollment.is_active ? 'Yes' : 'No'}</div>
                                        </div>
                                    )) || <div className="text-gray-500">No active enrollments</div>}
                                </div>
                            </div>

                            {/* Available Portals */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-3">Available Portals</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {debugData.enrolledPortals?.map((portal: any) => (
                                        <div key={portal.id} className="border border-green-200 bg-green-50 dark:bg-green-900/20 rounded p-3 text-sm">
                                            <div><strong>Name:</strong> {portal.name}</div>
                                            <div><strong>ID:</strong> {portal.id}</div>
                                            <div><strong>Active:</strong> {portal.is_active ? 'Yes' : 'No'}</div>
                                        </div>
                                    )) || <div className="text-gray-500">No available portals</div>}
                                </div>
                            </div>
                        </div>

                        {/* Members Page Query Result */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-3">Members Page Query Result</h3>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                                <div className="text-sm mb-2"><strong>Query:</strong> {debugData.membersPageQuery?.query}</div>
                                <div className="text-sm mb-2"><strong>Result Count:</strong> {debugData.membersPageQuery?.data?.length || 0}</div>
                                {debugData.membersPageQuery?.error && (
                                    <div className="text-sm text-red-600"><strong>Error:</strong> {debugData.membersPageQuery.error.message}</div>
                                )}
                            </div>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded mt-3 overflow-auto max-h-32">
                                {JSON.stringify(debugData.membersPageQuery?.data, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {debugData.error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
                        <pre className="text-sm text-red-700 dark:text-red-300">{debugData.error}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}