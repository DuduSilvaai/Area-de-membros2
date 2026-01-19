'use client';

import { useState } from 'react';
import { debugUserAccess } from './actions';

export default function DebugUser() {
    const [userEmail, setUserEmail] = useState('pereiragaminho@games.com');
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const handleDebug = async () => {
        if (!userEmail) return;

        setLoading(true);
        try {
            const result = await debugUserAccess(userEmail);
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
                    Debug User Access (Server-side)
                </h1>

                <div className="mb-6 flex gap-4 items-center">
                    <input
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="User email to debug"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex-1 max-w-md"
                    />
                    <button
                        onClick={handleDebug}
                        disabled={loading || !userEmail}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Debugging...' : 'Debug User'}
                    </button>
                </div>

                {results.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                        <pre className="text-red-700 text-sm whitespace-pre-wrap">{results.error}</pre>
                    </div>
                )}

                {results.success && results.data && (
                    <div className="space-y-6">
                        {/* Summary */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4">Summary for {results.data.user.email}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded text-center">
                                    <div className="text-2xl font-bold text-blue-600">{results.data.summary.totalEnrollments}</div>
                                    <div className="text-sm text-blue-800 dark:text-blue-200">Total Enrollments</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded text-center">
                                    <div className="text-2xl font-bold text-green-600">{results.data.summary.activeEnrollments}</div>
                                    <div className="text-sm text-green-800 dark:text-green-200">Active Enrollments</div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded text-center">
                                    <div className="text-2xl font-bold text-purple-600">{results.data.summary.expectedPortals}</div>
                                    <div className="text-sm text-purple-800 dark:text-purple-200">Expected Portals</div>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded text-center">
                                    <div className={`text-2xl font-bold ${
                                        results.data.summary.actualPortals === results.data.summary.expectedPortals 
                                            ? 'text-green-600' 
                                            : 'text-red-600'
                                    }`}>
                                        {results.data.summary.actualPortals}
                                    </div>
                                    <div className="text-sm text-orange-800 dark:text-orange-200">Actual Portals</div>
                                </div>
                            </div>
                        </div>

                        {/* Issues */}
                        {results.data.issues && results.data.issues.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">
                                    Issues Found ({results.data.issues.length})
                                </h2>
                                <ul className="space-y-2">
                                    {results.data.issues.map((issue: string, index: number) => (
                                        <li key={index} className="text-red-700 dark:text-red-300 flex items-start gap-2">
                                            <span className="text-red-500 mt-1">•</span>
                                            {issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Mismatch Alert */}
                        {results.data.summary.actualPortals !== results.data.summary.expectedPortals && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Portal Count Mismatch!</h2>
                                <p className="text-yellow-700 dark:text-yellow-300">
                                    Expected {results.data.summary.expectedPortals} portals but members page query returned {results.data.summary.actualPortals} portals.
                                    This explains why the user is not seeing all their portals.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Active Enrollments */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-3">Active Enrollments ({results.data.activeEnrollments.length})</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {results.data.activeEnrollments.map((enrollment: any) => (
                                        <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded p-3 text-sm">
                                            <div><strong>Portal ID:</strong> {enrollment.portal_id}</div>
                                            <div><strong>Active:</strong> {enrollment.is_active ? 'Yes' : 'No'}</div>
                                            <div><strong>Enrolled:</strong> {new Date(enrollment.enrolled_at).toLocaleString()}</div>
                                        </div>
                                    ))}
                                    {results.data.activeEnrollments.length === 0 && (
                                        <div className="text-gray-500 text-center py-4">No active enrollments</div>
                                    )}
                                </div>
                            </div>

                            {/* Expected Portals */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-3">Expected Portals ({results.data.enrolledPortals.length})</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {results.data.enrolledPortals.map((portal: any) => (
                                        <div key={portal.id} className="border border-green-200 bg-green-50 dark:bg-green-900/20 rounded p-3 text-sm">
                                            <div><strong>Name:</strong> {portal.name}</div>
                                            <div><strong>ID:</strong> {portal.id}</div>
                                            <div><strong>Active:</strong> {portal.is_active ? 'Yes' : 'No'}</div>
                                        </div>
                                    ))}
                                    {results.data.enrolledPortals.length === 0 && (
                                        <div className="text-gray-500 text-center py-4">No expected portals</div>
                                    )}
                                </div>
                            </div>

                            {/* Members Page Result */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-3">Members Page Result ({results.data.membersPageResult.length})</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {results.data.membersPageResult.map((portal: any) => (
                                        <div key={portal.id} className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded p-3 text-sm">
                                            <div><strong>Name:</strong> {portal.name}</div>
                                            <div><strong>ID:</strong> {portal.id}</div>
                                            <div><strong>Active:</strong> {portal.is_active ? 'Yes' : 'No'}</div>
                                        </div>
                                    ))}
                                    {results.data.membersPageResult.length === 0 && (
                                        <div className="text-gray-500 text-center py-4">No portals returned</div>
                                    )}
                                </div>
                            </div>

                            {/* All Portals */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                                <h3 className="font-semibold mb-3">All Portals ({results.data.allPortals.length})</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {results.data.allPortals.map((portal: any) => {
                                        const isEnrolled = results.data.enrolledPortalIds.includes(portal.id);
                                        return (
                                            <div key={portal.id} className={`border rounded p-3 text-sm ${
                                                isEnrolled 
                                                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                                                    : 'border-gray-200 dark:border-gray-700'
                                            }`}>
                                                <div><strong>Name:</strong> {portal.name}</div>
                                                <div><strong>ID:</strong> {portal.id}</div>
                                                <div><strong>Active:</strong> {portal.is_active ? 'Yes' : 'No'}</div>
                                                <div><strong>Enrolled:</strong> {isEnrolled ? 'Yes' : 'No'}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
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

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Use:</h3>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>1. Enter the user's email address (default: pereiragaminho@games.com)</li>
                        <li>2. Click "Debug User" to analyze their access</li>
                        <li>3. Check the summary to see if expected vs actual portals match</li>
                        <li>4. Review any issues found in the red alert box</li>
                        <li>5. Compare the different portal lists to identify the problem</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}