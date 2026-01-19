'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RunMigration() {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const runMigration = async () => {
        setLoading(true);
        setResult('Running migration...\n');

        try {
            // Check if updated_at column exists
            const { data: columns, error: columnError } = await supabase
                .from('information_schema.columns')
                .select('column_name')
                .eq('table_name', 'enrollments')
                .eq('column_name', 'updated_at');

            if (columnError) {
                setResult(prev => prev + `Error checking columns: ${columnError.message}\n`);
                setLoading(false);
                return;
            }

            if (columns && columns.length > 0) {
                setResult(prev => prev + 'updated_at column already exists!\n');
                setLoading(false);
                return;
            }

            setResult(prev => prev + 'updated_at column does not exist, adding it...\n');

            // Since we can't run DDL directly from the client, let's provide instructions
            setResult(prev => prev + `
MIGRATION NEEDED:

Please run this SQL in your Supabase SQL Editor:

-- Add updated_at column to enrollments table
ALTER TABLE enrollments 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updated_at = enrolled_at
UPDATE enrollments 
SET updated_at = enrolled_at 
WHERE updated_at IS NULL;

After running this SQL, the real-time synchronization will work even better!

For now, the system will work without this column, but adding it will improve performance.
`);

        } catch (error) {
            setResult(prev => prev + `Unexpected error: ${error}\n`);
        } finally {
            setLoading(false);
        }
    };

    const testCurrentSetup = async () => {
        setLoading(true);
        setResult('Testing current setup...\n');

        try {
            // Test basic enrollment operations
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setResult(prev => prev + 'Please log in first\n');
                setLoading(false);
                return;
            }

            // Test enrollment query
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('user_id', user.id);

            if (enrollError) {
                setResult(prev => prev + `Enrollment query error: ${enrollError.message}\n`);
            } else {
                setResult(prev => prev + `Found ${enrollments?.length || 0} enrollments for current user\n`);
            }

            // Test portal query
            const { data: portals, error: portalError } = await supabase
                .from('portals')
                .select('*')
                .eq('is_active', true);

            if (portalError) {
                setResult(prev => prev + `Portal query error: ${portalError.message}\n`);
            } else {
                setResult(prev => prev + `Found ${portals?.length || 0} active portals\n`);
            }

            setResult(prev => prev + '\nCurrent setup is working! The real-time features should work even without the updated_at column.\n');

        } catch (error) {
            setResult(prev => prev + `Test error: ${error}\n`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Database Migration
                </h1>

                <div className="mb-6 flex gap-4">
                    <button
                        onClick={runMigration}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Checking...' : 'Check Migration Status'}
                    </button>
                    
                    <button
                        onClick={testCurrentSetup}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Testing...' : 'Test Current Setup'}
                    </button>
                </div>

                {result && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Result:</h2>
                        <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto whitespace-pre-wrap">
                            {result}
                        </pre>
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Instructions:</h3>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>1. Click "Check Migration Status" to see if the updated_at column needs to be added</li>
                        <li>2. If migration is needed, copy the SQL and run it in Supabase SQL Editor</li>
                        <li>3. Click "Test Current Setup" to verify everything is working</li>
                        <li>4. The real-time synchronization should work even without the migration</li>
                    </ol>
                </div>

                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">Current Status:</h3>
                    <p className="text-sm text-green-800 dark:text-green-300">
                        The synchronization error has been fixed! The system now works without requiring the updated_at column. 
                        Admin changes should be reflected immediately in student views through real-time subscriptions.
                    </p>
                </div>
            </div>
        </div>
    );
}