'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function TestAccess() {
    const { user } = useAuth();
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const runTests = async () => {
            if (!user) return;

            const testResults: any = {
                userId: user.id,
                userEmail: user.email,
                timestamp: new Date().toISOString()
            };

            try {
                // Test 1: Direct enrollment query
                console.log('=== TEST 1: Direct Enrollment Query ===');
                const { data: enrollments, error: enrollError } = await supabase
                    .from('enrollments')
                    .select('*')
                    .eq('user_id', user.id);

                testResults.allEnrollments = {
                    data: enrollments,
                    error: enrollError,
                    count: enrollments?.length || 0
                };
                console.log('All enrollments:', enrollments);

                // Test 2: Active enrollments only
                console.log('=== TEST 2: Active Enrollments Only ===');
                const { data: activeEnrollments, error: activeError } = await supabase
                    .from('enrollments')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('is_active', true);

                testResults.activeEnrollments = {
                    data: activeEnrollments,
                    error: activeError,
                    count: activeEnrollments?.length || 0
                };
                console.log('Active enrollments:', activeEnrollments);

                // Test 3: All portals
                console.log('=== TEST 3: All Portals ===');
                const { data: allPortals, error: portalsError } = await supabase
                    .from('portals')
                    .select('*')
                    .eq('is_active', true);

                testResults.allPortals = {
                    data: allPortals,
                    error: portalsError,
                    count: allPortals?.length || 0
                };
                console.log('All portals:', allPortals);

                // Test 4: Join query (original approach)
                console.log('=== TEST 4: Join Query ===');
                const { data: joinResult, error: joinError } = await supabase
                    .from('portals')
                    .select(`
                        *,
                        enrollments!inner(
                            id,
                            user_id,
                            is_active,
                            permissions
                        )
                    `)
                    .eq('enrollments.user_id', user.id)
                    .eq('enrollments.is_active', true)
                    .eq('is_active', true);

                testResults.joinQuery = {
                    data: joinResult,
                    error: joinError,
                    count: joinResult?.length || 0
                };
                console.log('Join query result:', joinResult);

                // Test 5: Manual approach
                console.log('=== TEST 5: Manual Approach ===');
                if (activeEnrollments && activeEnrollments.length > 0) {
                    const portalIds = activeEnrollments.map(e => e.portal_id);
                    const { data: manualPortals, error: manualError } = await supabase
                        .from('portals')
                        .select('*')
                        .in('id', portalIds)
                        .eq('is_active', true);

                    testResults.manualApproach = {
                        data: manualPortals,
                        error: manualError,
                        count: manualPortals?.length || 0,
                        portalIds: portalIds
                    };
                    console.log('Manual approach result:', manualPortals);
                } else {
                    testResults.manualApproach = {
                        data: null,
                        error: 'No active enrollments to fetch portals',
                        count: 0,
                        portalIds: []
                    };
                }

                setResults(testResults);

            } catch (error) {
                console.error('Test error:', error);
                testResults.error = error;
                setResults(testResults);
            } finally {
                setLoading(false);
            }
        };

        runTests();
    }, [user]);

    if (!user) {
        return <div className="p-8">Please log in to run tests.</div>;
    }

    if (loading) {
        return <div className="p-8">Running tests...</div>;
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Access Test Results for {user.email}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Test 1: All Enrollments */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-blue-600">
                            Test 1: All Enrollments ({results.allEnrollments?.count || 0})
                        </h2>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-40">
                            {JSON.stringify(results.allEnrollments, null, 2)}
                        </pre>
                    </div>

                    {/* Test 2: Active Enrollments */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-green-600">
                            Test 2: Active Enrollments ({results.activeEnrollments?.count || 0})
                        </h2>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-40">
                            {JSON.stringify(results.activeEnrollments, null, 2)}
                        </pre>
                    </div>

                    {/* Test 3: All Portals */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-purple-600">
                            Test 3: All Portals ({results.allPortals?.count || 0})
                        </h2>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-40">
                            {JSON.stringify(results.allPortals, null, 2)}
                        </pre>
                    </div>

                    {/* Test 4: Join Query */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 text-red-600">
                            Test 4: Join Query ({results.joinQuery?.count || 0})
                        </h2>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-40">
                            {JSON.stringify(results.joinQuery, null, 2)}
                        </pre>
                    </div>

                    {/* Test 5: Manual Approach */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 text-orange-600">
                            Test 5: Manual Approach ({results.manualApproach?.count || 0})
                        </h2>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-40">
                            {JSON.stringify(results.manualApproach, null, 2)}
                        </pre>
                    </div>

                    {/* Test 6: Direct Enrollment Creation */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 lg:col-span-2">
                        <h2 className="text-lg font-semibold mb-4 text-pink-600">
                            Test 6: Direct Enrollment Creation
                        </h2>
                        <button
                            onClick={async () => {
                                try {
                                    console.log('Testing direct enrollment creation...');
                                    
                                    // Get first portal ID for testing
                                    const { data: portals } = await supabase
                                        .from('portals')
                                        .select('id')
                                        .limit(1);
                                    
                                    if (!portals || portals.length === 0) {
                                        alert('No portals found for testing');
                                        return;
                                    }
                                    
                                    const portalId = portals[0].id;
                                    console.log('Testing with portal ID:', portalId);
                                    
                                    // Try direct insert
                                    const { data, error } = await supabase
                                        .from('enrollments')
                                        .insert({
                                            user_id: user.id,
                                            portal_id: portalId,
                                            permissions: {
                                                access_all: true,
                                                allowed_modules: []
                                            },
                                            is_active: true
                                        })
                                        .select()
                                        .single();
                                    
                                    console.log('Direct insert result:', { data, error });
                                    
                                    if (error) {
                                        alert(`Error: ${error.message}`);
                                    } else {
                                        alert('Enrollment created successfully! Refresh the page to see results.');
                                    }
                                } catch (err) {
                                    console.error('Test error:', err);
                                    alert(`Unexpected error: ${err}`);
                                }
                            }}
                            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                        >
                            Test Direct Enrollment Creation
                        </button>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            This will attempt to create an enrollment directly in the database.
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Summary</h2>
                    <div className="space-y-2 text-sm">
                        <div>User ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{results.userId}</code></div>
                        <div>User Email: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{results.userEmail}</code></div>
                        <div>Test Time: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{results.timestamp}</code></div>
                        <div className="pt-2">
                            <strong>Expected Result:</strong> If user has active enrollments, they should see portals in the members page.
                        </div>
                        <div>
                            <strong>Recommended Approach:</strong> {results.activeEnrollments?.count > 0 ? 'Manual Approach (Test 5)' : 'No active enrollments found'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}