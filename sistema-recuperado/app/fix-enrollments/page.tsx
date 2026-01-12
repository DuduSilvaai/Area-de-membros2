'use client';

import { useState } from 'react';
import { createMissingEnrollments, deleteAllEnrollments } from './actions';

export default function FixEnrollments() {
    const [userEmail, setUserEmail] = useState('pereiragaminho@games.com');
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const handleCreateMissing = async () => {
        if (!userEmail) return;

        setLoading(true);
        try {
            const result = await createMissingEnrollments(userEmail);
            setResults(result);
        } catch (error) {
            setResults({ error: `Client error: ${error}` });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        if (!userEmail) return;
        
        const confirmed = confirm(`Are you sure you want to delete ALL enrollments for ${userEmail}? This cannot be undone.`);
        if (!confirmed) return;

        setLoading(true);
        try {
            const result = await deleteAllEnrollments(userEmail);
            setResults(result);
        } catch (error) {
            setResults({ error: `Client error: ${error}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Fix User Enrollments
                </h1>

                <div className="mb-6 flex gap-4 items-center">
                    <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="User email to fix"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1 max-w-md"
                    />
                    <button
                        onClick={handleCreateMissing}
                        disabled={loading || !userEmail}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Missing Enrollments'}
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        disabled={loading || !userEmail}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? 'Deleting...' : 'Delete All Enrollments'}
                    </button>
                </div>

                {results.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                        <pre className="text-red-700 text-sm whitespace-pre-wrap">{results.error}</pre>
                    </div>
                )}

                {results.success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-green-800 mb-2">Success!</h2>
                        <p className="text-green-700 mb-4">{results.message}</p>
                        
                        {results.data && (
                            <div className="bg-white rounded p-4">
                                <h3 className="font-medium mb-2">Details:</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    {results.data.existingEnrollments !== undefined && (
                                        <div>
                                            <div className="font-medium">Existing Enrollments</div>
                                            <div className="text-gray-600">{results.data.existingEnrollments}</div>
                                        </div>
                                    )}
                                    {results.data.createdEnrollments !== undefined && (
                                        <div>
                                            <div className="font-medium">Created Enrollments</div>
                                            <div className="text-gray-600">{results.data.createdEnrollments}</div>
                                        </div>
                                    )}
                                    {results.data.totalEnrollments !== undefined && (
                                        <div>
                                            <div className="font-medium">Total Enrollments</div>
                                            <div className="text-gray-600">{results.data.totalEnrollments}</div>
                                        </div>
                                    )}
                                    {results.data.deletedCount !== undefined && (
                                        <div>
                                            <div className="font-medium">Deleted Enrollments</div>
                                            <div className="text-gray-600">{results.data.deletedCount}</div>
                                        </div>
                                    )}
                                </div>
                                
                                {results.data.createdFor && results.data.createdFor.length > 0 && (
                                    <div className="mt-4">
                                        <div className="font-medium mb-2">Created access for portals:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {results.data.createdFor.map((portalName: string, index: number) => (
                                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                                                    {portalName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Instructions</h2>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h3 className="font-medium text-green-700">Create Missing Enrollments:</h3>
                            <p className="text-gray-600">
                                This will automatically create enrollments for all active portals that the user doesn't have access to yet.
                                It's safe to run multiple times - it won't create duplicates.
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-red-700">Delete All Enrollments:</h3>
                            <p className="text-gray-600">
                                This will remove ALL enrollments for the user. Use this to reset their access completely.
                                ⚠️ This action cannot be undone!
                            </p>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                            <h3 className="font-medium text-blue-700 mb-2">Recommended Workflow:</h3>
                            <ol className="text-blue-600 space-y-1">
                                <li>1. Use the debug page to identify missing enrollments</li>
                                <li>2. Click "Create Missing Enrollments" to fix the issue</li>
                                <li>3. Go back to the debug page to verify the fix</li>
                                <li>4. Test the members page to confirm the user can see all portals</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-4">
                    <a
                        href="/debug-user"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Debug Page
                    </a>
                    <a
                        href="/members"
                        target="_blank"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Test Members Page
                    </a>
                </div>
            </div>
        </div>
    );
}