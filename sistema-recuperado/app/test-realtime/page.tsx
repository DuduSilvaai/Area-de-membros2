'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export default function TestRealtime() {
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Initial fetch
        const fetchEnrollments = async () => {
            const { data, error } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', user.id);

            if (!error) {
                setEnrollments(data || []);
            }
        };

        fetchEnrollments();

        // Set up realtime subscription
        console.log('Setting up realtime subscription for user:', user.id);
        
        const subscription = supabase
            .channel('test-enrollment-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'enrollments',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Realtime event received:', payload);
                    
                    // Add to events log
                    setRealtimeEvents(prev => [
                        {
                            timestamp: new Date().toISOString(),
                            event: payload.eventType,
                            data: payload.new || payload.old,
                            payload: payload
                        },
                        ...prev.slice(0, 9) // Keep last 10 events
                    ]);

                    // Update enrollments based on event type
                    if (payload.eventType === 'INSERT') {
                        setEnrollments(prev => [...prev, payload.new]);
                    } else if (payload.eventType === 'UPDATE') {
                        setEnrollments(prev => 
                            prev.map(e => e.id === payload.new.id ? payload.new : e)
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setEnrollments(prev => 
                            prev.filter(e => e.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
                setIsSubscribed(status === 'SUBSCRIBED');
            });

        return () => {
            console.log('Cleaning up realtime subscription');
            supabase.removeChannel(subscription);
        };
    }, [user]);

    const testDirectInsert = async () => {
        if (!user) return;

        try {
            // Get first portal for testing
            const { data: portals } = await supabase
                .from('portals')
                .select('id')
                .limit(1);

            if (!portals || portals.length === 0) {
                alert('No portals found for testing');
                return;
            }

            const portalId = portals[0].id;
            
            // Insert test enrollment
            const { data, error } = await supabase
                .from('enrollments')
                .insert({
                    user_id: user.id,
                    portal_id: portalId,
                    permissions: { access_all: true, test: true },
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                console.error('Test insert error:', error);
                alert(`Error: ${error.message}`);
            } else {
                console.log('Test insert successful:', data);
                alert('Test enrollment created! Check if realtime event was received.');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            alert(`Unexpected error: ${err}`);
        }
    };

    const testDirectUpdate = async () => {
        if (!user || enrollments.length === 0) return;

        try {
            const enrollment = enrollments[0];
            
            const { data, error } = await supabase
                .from('enrollments')
                .update({
                    permissions: { 
                        ...enrollment.permissions, 
                        test_update: true, 
                        updated_at: new Date().toISOString() 
                    },
                    updated_at: new Date().toISOString()
                })
                .eq('id', enrollment.id)
                .select()
                .single();

            if (error) {
                console.error('Test update error:', error);
                alert(`Error: ${error.message}`);
            } else {
                console.log('Test update successful:', data);
                alert('Test enrollment updated! Check if realtime event was received.');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            alert(`Unexpected error: ${err}`);
        }
    };

    const testDirectDelete = async () => {
        if (!user || enrollments.length === 0) return;

        try {
            const enrollment = enrollments[enrollments.length - 1]; // Delete last one
            
            const { error } = await supabase
                .from('enrollments')
                .delete()
                .eq('id', enrollment.id);

            if (error) {
                console.error('Test delete error:', error);
                alert(`Error: ${error.message}`);
            } else {
                console.log('Test delete successful');
                alert('Test enrollment deleted! Check if realtime event was received.');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            alert(`Unexpected error: ${err}`);
        }
    };

    if (!user) {
        return <div className="p-8">Please log in to test realtime functionality.</div>;
    }

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Realtime Test for {user.email}
                </h1>

                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        isSubscribed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {isSubscribed ? 'Connected to Realtime' : 'Not Connected'}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Enrollments */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Current Enrollments ({enrollments.length})
                        </h2>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {enrollments.map((enrollment) => (
                                <div key={enrollment.id} className="border border-gray-200 dark:border-gray-700 rounded p-3 text-sm">
                                    <div><strong>ID:</strong> {enrollment.id}</div>
                                    <div><strong>Portal:</strong> {enrollment.portal_id}</div>
                                    <div><strong>Active:</strong> {enrollment.is_active ? 'Yes' : 'No'}</div>
                                    <div><strong>Updated:</strong> {new Date(enrollment.updated_at || enrollment.enrolled_at).toLocaleString()}</div>
                                </div>
                            ))}
                            
                            {enrollments.length === 0 && (
                                <div className="text-gray-500 text-center py-4">
                                    No enrollments found
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex gap-2 flex-wrap">
                            <button
                                onClick={testDirectInsert}
                                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                                Test Insert
                            </button>
                            <button
                                onClick={testDirectUpdate}
                                disabled={enrollments.length === 0}
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                                Test Update
                            </button>
                            <button
                                onClick={testDirectDelete}
                                disabled={enrollments.length === 0}
                                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                            >
                                Test Delete
                            </button>
                        </div>
                    </div>

                    {/* Realtime Events */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Realtime Events ({realtimeEvents.length})
                        </h2>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {realtimeEvents.map((event, index) => (
                                <div key={index} className={`border rounded p-3 text-sm ${
                                    event.event === 'INSERT' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                                    event.event === 'UPDATE' ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' :
                                    event.event === 'DELETE' ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
                                    'border-gray-300'
                                }`}>
                                    <div><strong>Event:</strong> {event.event}</div>
                                    <div><strong>Time:</strong> {new Date(event.timestamp).toLocaleTimeString()}</div>
                                    <div><strong>Data:</strong></div>
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                                        {JSON.stringify(event.data, null, 2)}
                                    </pre>
                                </div>
                            ))}
                            
                            {realtimeEvents.length === 0 && (
                                <div className="text-gray-500 text-center py-4">
                                    No realtime events received yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Test:</h3>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>1. Make sure you're connected to realtime (green status above)</li>
                        <li>2. Use the test buttons to create/update/delete enrollments</li>
                        <li>3. Watch for realtime events to appear in the right panel</li>
                        <li>4. Open another tab with the members page to see if changes appear there too</li>
                        <li>5. Have an admin make changes to your enrollments and see if they appear here</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}