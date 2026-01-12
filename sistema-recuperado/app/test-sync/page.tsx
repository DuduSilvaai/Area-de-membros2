'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function TestSync() {
    const { user } = useAuth();
    const [testResults, setTestResults] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const runSyncTest = async () => {
        if (!user) return;

        setLoading(true);
        const results: any = {
            timestamp: new Date().toISOString(),
            userId: user.id,
            userEmail: user.email,
            steps: []
        };

        try {
            // Step 1: Get initial state
            results.steps.push({ step: 1, action: 'Getting initial state', timestamp: new Date().toISOString() });
            
            const { data: initialEnrollments } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', user.id);
            
            results.initialEnrollments = initialEnrollments || [];
            results.steps.push({ 
                step: 1, 
                result: `Found ${initialEnrollments?.length || 0} existing enrollments`,
                timestamp: new Date().toISOString()
            });

            // Step 2: Get a test portal
            const { data: portals } = await supabase
                .from('portals')
                .select('id, name')
                .eq('is_active', true)
                .limit(1);

            if (!portals || portals.length === 0) {
                results.error = 'No active portals found for testing';
                setTestResults(results);
                setLoading(false);
                return;
            }

            const testPortal = portals[0];
            results.testPortal = testPortal;
            results.steps.push({ 
                step: 2, 
                result: `Using test portal: ${testPortal.name} (${testPortal.id})`,
                timestamp: new Date().toISOString()
            });

            // Step 3: Check if enrollment already exists
            const existingEnrollment = initialEnrollments?.find(e => e.portal_id === testPortal.id);
            
            if (existingEnrollment) {
                results.steps.push({ 
                    step: 3, 
                    result: 'Enrollment already exists, will test update',
                    timestamp: new Date().toISOString()
                });

                // Test update
                const { data: updateResult, error: updateError } = await supabase
                    .from('enrollments')
                    .update({
                        permissions: {
                            access_all: true,
                            test_sync: true,
                            test_timestamp: new Date().toISOString()
                        }
                    })
                    .eq('id', existingEnrollment.id)
                    .select()
                    .single();

                results.updateResult = { data: updateResult, error: updateError };
                results.steps.push({ 
                    step: 3, 
                    result: updateError ? `Update failed: ${updateError.message}` : 'Update successful',
                    timestamp: new Date().toISOString()
                });
            } else {
                results.steps.push({ 
                    step: 3, 
                    result: 'No existing enrollment, will test insert',
                    timestamp: new Date().toISOString()
                });

                // Test insert
                const { data: insertResult, error: insertError } = await supabase
                    .from('enrollments')
                    .insert({
                        user_id: user.id,
                        portal_id: testPortal.id,
                        permissions: {
                            access_all: true,
                            test_sync: true,
                            test_timestamp: new Date().toISOString()
                        },
                        is_active: true
                    })
                    .select()
                    .single();

                results.insertResult = { data: insertResult, error: insertError };
                results.steps.push({ 
                    step: 3, 
                    result: insertError ? `Insert failed: ${insertError.message}` : 'Insert successful',
                    timestamp: new Date().toISOString()
                });
            }

            // Step 4: Wait a moment and check final state
            results.steps.push({ 
                step: 4, 
                action: 'Waiting 2 seconds for propagation...',
                timestamp: new Date().toISOString()
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            const { data: finalEnrollments } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', user.id);

            results.finalEnrollments = finalEnrollments || [];
            results.steps.push({ 
                step: 4, 
                result: `Final state: ${finalEnrollments?.length || 0} enrollments`,
                timestamp: new Date().toISOString()
            });

            // Step 5: Test members page query
            results.steps.push({ 
                step: 5, 
                action: 'Testing members page query...',
                timestamp: new Date().toISOString()
            });

            const { data: userEnrollments } = await supabase
                .from('enrollments')
                .select('portal_id, permissions, enrolled_at')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('enrolled_at', { ascending: false });

            if (userEnrollments && userEnrollments.length > 0) {
                const portalIds = userEnrollments.map(e => e.portal_id);
                const { data: memberPortals } = await supabase
                    .from('portals')
                    .select('*')
                    .in('id', portalIds)
                    .eq('is_active', true)
                    .order('name');

                results.membersPageResult = {
                    enrollments: userEnrollments,
                    portals: memberPortals
                };
                results.steps.push({ 
                    step: 5, 
                    result: `Members page would show ${memberPortals?.length || 0} portals`,
                    timestamp: new Date().toISOString()
                });
            } else {
                results.membersPageResult = { enrollments: [], portals: [] };
                results.steps.push({ 
                    step: 5, 
                    result: 'Members page would show no portals',
                    timestamp: new Date().toISOString()
                });
            }

            setTestResults(results);

        } catch (error) {
            console.error('Test error:', error);
            results.error = error;
            setTestResults(results);
        } finally {
            setLoading(false);
        }
    };

    const cleanupTestData = async () => {
        if (!user) return;

        try {
            // Delete test enrollments
            const { error } = await supabase
                .from('enrollments')
                .delete()
                .eq('user_id', user.id)
                .like('permissions->test_sync', 'true');

            if (error) {
                alert(`Cleanup error: ${error.message}`);
            } else {
                alert('Test data cleaned up successfully');
                setTestResults({});
            }
        } catch (err) {
            alert(`Cleanup error: ${err}`);
        }
    };

    if (!user) {
        return <div className="p-8">Please log in to run sync tests.</div>;
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Synchronization Test for {user.email}
                </h1>

                <div className="mb-6 flex gap-4">
                    <button
                        onClick={runSyncTest}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Running Test...' : 'Run Sync Test'}
                    </button>
                    
                    <button
                        onClick={cleanupTestData}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        Cleanup Test Data
                    </button>

                    <a
                        href="/members"
                        target="_blank"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Open Members Page
                    </a>

                    <a
                        href="/test-realtime"
                        target="_blank"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Open Realtime Test
                    </a>
                </div>

                {testResults.timestamp && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Test Results - {new Date(testResults.timestamp).toLocaleString()}
                        </h2>

                        {/* Test Steps */}
                        <div className="mb-6">
                            <h3 className="font-medium mb-3">Test Steps:</h3>
                            <div className="space-y-2">
                                {testResults.steps?.map((step: any, index: number) => (
                                    <div key={index} className="flex items-start gap-3 text-sm">
                                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full flex items-center justify-center text-xs font-bold">
                                            {step.step}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{step.action || step.result}</div>
                                            <div className="text-gray-500 text-xs">
                                                {new Date(step.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Initial State */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                                <h4 className="font-medium mb-2">Initial Enrollments ({testResults.initialEnrollments?.length || 0})</h4>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(testResults.initialEnrollments, null, 2)}
                                </pre>
                            </div>

                            {/* Final State */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded p-4">
                                <h4 className="font-medium mb-2">Final Enrollments ({testResults.finalEnrollments?.length || 0})</h4>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(testResults.finalEnrollments, null, 2)}
                                </pre>
                            </div>

                            {/* Members Page Result */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded p-4 md:col-span-2">
                                <h4 className="font-medium mb-2">
                                    Members Page Result ({testResults.membersPageResult?.portals?.length || 0} portals)
                                </h4>
                                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                                    {JSON.stringify(testResults.membersPageResult, null, 2)}
                                </pre>
                            </div>
                        </div>

                        {/* Error Display */}
                        {testResults.error && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Error:</h4>
                                <pre className="text-xs text-red-700 dark:text-red-300">
                                    {JSON.stringify(testResults.error, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Test Synchronization:</h3>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>1. Run the sync test to create/update test enrollment data</li>
                        <li>2. Open the Members Page in a new tab to see if the portal appears</li>
                        <li>3. Open the Realtime Test page to monitor live changes</li>
                        <li>4. Have an admin modify your enrollments and watch for real-time updates</li>
                        <li>5. Use the refresh button on the Members page to force updates</li>
                        <li>6. Clean up test data when done</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}