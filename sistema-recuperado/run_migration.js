// Simple script to run the database migration
// Run this with: node run_migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('Running migration to add updated_at column...');
        
        // Read the SQL file
        const sqlContent = fs.readFileSync(path.join(__dirname, 'add_updated_at_to_enrollments.sql'), 'utf8');
        
        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
        
        if (error) {
            console.error('Migration error:', error);
        } else {
            console.log('Migration completed successfully!');
            console.log('Result:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

runMigration();