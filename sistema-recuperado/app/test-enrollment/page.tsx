'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { upsertEnrollment } from '@/app/(admin)/users/actions';

export default function TestEnrollment() {
    const { user } = useAuth();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testEnrollment = async () => {
        if (!user) {
            alert('Please log in first');
            return;
        }

        setLoading(true);
        try {
            // Test with a hardcoded portal ID (you'll need to replace this with a real portal ID)
            const testPortalId = '15dcb19d-2ca0-41e1-bdb3-36c3782373dc'; // Replace with actual portal ID
            
            const permissions = {
                access_all: true,
                allowed_modules: [],
                access_granted_at: new Date().toISOString()
            };

            console.log('Testing upsertEnrollment with:', {
                userId: user.id,
                portalId: testPortalId,
                permissions
            });

            const result = await upsertEnrollment(user.id, testPortalId, permissions);
            
            console.log('upsertEnrollment result:', result);
            setResult(result);

            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert('Success! Check the console for details.');
            }
        } catch (error) {
            console.error('Test error:', error);
            setResult({ error: error.toString() });
            alert(`Unexpected error: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Test Enrollment</h1>
                <p>Please log in to test enrollment functionality.</p>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Test Enrollment Function
                </h1>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">User Info</h2>
                    <div className="space-y-2 text-sm">
                        <div>ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{user.id}</code></div>
                        <div>Email: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{user.email}</code></div>
                        <div>Role: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{user.user_metadata?.role || 'member'}</code></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Test upsertEnrollment Function</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        This will test the server action that should create an enrollment.
                    </p>
                    
                    <button
                        onClick={testEnrollment}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Testing...' : 'Test Enrollment Creation'}
                    </button>
                </div>

                {result && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Result</h2>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Note:</strong> Make sure to check the browser console and server logs for detailed information.</p>
                    <p><strong>Expected:</strong> If successful, you should see enrollment data in the result and logs in the server console.</p>
                </div>
            </div>
        </div>
    );
}