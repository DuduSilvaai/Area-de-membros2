'use client';

import { useState } from 'react';
import { testDeleteEnrollment, testMembersPageQuery } from './actions';

export default function TestDelete() {
    const [userEmail, setUserEmail] = useState('pereiragaminho@games.com');
    const [portalName, setPortalName] = useState('teste');
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const handleTestDelete = async () => {
        if (!userEmail || !portalName) return;

        setLoading(true);
        try {
            const result = await testDeleteEnrollment(userEmail, portalName);
            setResults(result);
        } catch (error) {
            setResults({ error: `Client error: ${error}` });
        } finally {
            setLoading(false);
        }
    };

    const handleTestMembersQuery = async () => {
        if (!userEmail) return;

        setLoading(true);
        try {
            const result = await testMembersPageQuery(userEmail);
            setResults(result);
        } catch (error) {
            setResults({ error: `Client error: ${error}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Test Delete Enrollment
                </h1>

                <div className="mb-6 space-y-4">
                    <div className="flex gap-4 items-center">
                        <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="User email"
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1 max-w-md"
                        />
                        <select
                            value={portalName}
                            onChange={(e) => setPortalName(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="Paulo">Paulo</option>
                            <option value="teste">teste</option>
                            <option value="Teste">Teste</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={handleTestDelete}
                            disabled={loading || !userEmail || !portalName}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {loading ? 'Testing...' : 'Test Delete Enrollment'}
                        </button>
                        
                        <button
                            onClick={handleTestMembersQuery}
                            disabled={loading || !userEmail}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Testing...' : 'Test Members Page Query'}
                        </button>
                    </div>
                </div>

                {results.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                        <pre className="text-red-700 text-sm whitespace-pre-wrap">{results.error}</pre>
                    </div>
                )}

                {results.success && (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-green-800 mb-2">Success!</h2>
                            <p className="text-green-700 mb-4">{results.message}</p>
                            
                            {results.data && (
                                <div className="bg-white rounded p-4">
                                    <h3 className="font-medium mb-4">Test Results:</h3>
                                    
                                    {/* Delete Test Results */}
                                    {results.data.beforeCount !== undefined && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{results.data.beforeCount}</div>
                                                <div className="text-sm text-gray-600">Before Delete</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-red-600">{results.data.deletedCount}</div>
                                                <div className="text-sm text-gray-600">Deleted</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{results.data.afterCount}</div>
                                                <div className="text-sm text-gray-600">After Delete</div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-2xl font-bold ${results.data.deleted ? 'text-green-600' : 'text-red-600'}`}>
                                                    {results.data.deleted ? '✓' : '✗'}
                                                </div>
                                                <div className="text-sm text-gray-600">Success</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Members Page Query Results */}
                                    {results.data.enrollments !== undefined && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{results.data.enrollments?.length || 0}</div>
                                                <div className="text-sm text-gray-600">Active Enrollments</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">{results.data.portalIds?.length || 0}</div>
                                                <div className="text-sm text-gray-600">Portal IDs</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{results.data.portals?.length || 0}</div>
                                                <div className="text-sm text-gray-600">Visible Portals</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Portal List */}
                                    {results.data.portals && results.data.portals.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-medium mb-2">Portals that would be visible:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {results.data.portals.map((portal: any) => (
                                                    <span key={portal.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                                        {portal.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All User Enrollments */}
                                    {results.data.allUserEnrollments && (
                                        <div className="mt-4">
                                            <h4 className="font-medium mb-2">All User Enrollments After Operation:</h4>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {results.data.allUserEnrollments.map((enrollment: any) => (
                                                    <div key={enrollment.id} className="text-xs bg-gray-100 p-2 rounded">
                                                        <div><strong>Portal ID:</strong> {enrollment.portal_id}</div>
                                                        <div><strong>Active:</strong> {enrollment.is_active ? 'Yes' : 'No'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Raw Data */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-3">Raw Data</h3>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-64">
                                {JSON.stringify(results.data, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Test:</h3>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>1. <strong>Test Delete:</strong> Select a portal and click "Test Delete Enrollment" to remove access</li>
                        <li>2. <strong>Test Members Query:</strong> Click "Test Members Page Query" to see what portals the user would see</li>
                        <li>3. Check the results to see if the deletion worked correctly</li>
                        <li>4. Go to the actual members page to verify the changes</li>
                    </ol>
                </div>

                <div className="mt-6 flex gap-4">
                    <a
                        href="/debug-user"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Go to Debug Page
                    </a>
                    <a
                        href="/members"
                        target="_blank"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Test Members Page
                    </a>
                </div>
            </div>
        </div>
    );
}