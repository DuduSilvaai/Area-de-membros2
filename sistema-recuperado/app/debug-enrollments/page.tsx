'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

export default function DebugEnrollments() {
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [portals, setPortals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                // Fetch all enrollments for current user
                const { data: enrollmentData, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('*')
                    .eq('user_id', user.id);

                if (enrollmentError) {
                    console.error('Error fetching enrollments:', enrollmentError);
                } else {
                    setEnrollments(enrollmentData || []);
                }

                // Fetch all portals
                const { data: portalData, error: portalError } = await supabase
                    .from('portals')
                    .select('*');

                if (portalError) {
                    console.error('Error fetching portals:', portalError);
                } else {
                    setPortals(portalData || []);
                }
            } catch (error) {
                console.error('Unexpected error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const refreshData = async () => {
        setLoading(true);
        if (!user) return;

        try {
            // Force fresh data by adding timestamp
            const timestamp = new Date().getTime();

            const { data: enrollmentData, error: enrollmentError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', user.id);

            if (enrollmentError) {
                console.error('Error fetching enrollments:', enrollmentError);
            } else {
                setEnrollments(enrollmentData || []);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="p-8">Please log in to view debug information.</div>;
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Debug: Enrollments for {user.email}
                    </h1>
                    <button
                        onClick={refreshData}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh Data'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Enrollments */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Active Enrollments ({enrollments.filter(e => e.is_active).length})
                        </h2>

                        {loading ? (
                            <div className="text-gray-500">Loading...</div>
                        ) : (
                            <div className="space-y-3">
                                {enrollments.filter(e => e.is_active).map((enrollment) => (
                                    <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                                        <div className="text-sm">
                                            <div><strong>Portal ID:</strong> {enrollment.portal_id}</div>
                                            <div><strong>User ID:</strong> {enrollment.user_id}</div>
                                            <div><strong>Active:</strong> {enrollment.is_active ? 'Yes' : 'No'}</div>
                                            <div><strong>Enrolled At:</strong> {new Date(enrollment.enrolled_at).toLocaleString()}</div>
                                            <div><strong>Permissions:</strong></div>
                                            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1">
                                                {JSON.stringify(enrollment.permissions, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                ))}

                                {enrollments.filter(e => e.is_active).length === 0 && (
                                    <div className="text-gray-500 text-center py-4">
                                        No active enrollments found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* All Portals */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            All Portals ({portals.length})
                        </h2>

                        <div className="space-y-3">
                            {portals.map((portal) => {
                                const hasEnrollment = enrollments.some(e =>
                                    e.portal_id === portal.id && e.is_active
                                );

                                return (
                                    <div key={portal.id} className={`border rounded p-3 ${hasEnrollment
                                            ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-200 dark:border-gray-700'
                                        }`}>
                                        <div className="text-sm">
                                            <div><strong>Name:</strong> {portal.name}</div>
                                            <div><strong>ID:</strong> {portal.id}</div>
                                            <div><strong>Active:</strong> {portal.is_active ? 'Yes' : 'No'}</div>
                                            <div><strong>Has Enrollment:</strong> {hasEnrollment ? 'Yes' : 'No'}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Raw Data */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Raw Data (JSON)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium mb-2">Enrollments:</h3>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-64">
                                {JSON.stringify(enrollments, null, 2)}
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-medium mb-2">Portals:</h3>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-64">
                                {JSON.stringify(portals, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}