const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper to load env manually
function loadEnv() {
    try {
        const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.warn('Could not read .env.local', e.message);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
    try {
        console.log('Applying evaluations schema...');
        const sqlContent = fs.readFileSync(path.join(__dirname, 'evaluations_schema.sql'), 'utf8');

        // Split by statement if needed, or send as one block if exec_sql supports it. 
        // exec_sql typically executes a string.

        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.error('Migration error:', error);
            // Fallback: Instructions
            console.log('\nIf exec_sql is not available, please run the content of evaluations_schema.sql in your Supabase SQL Editor.');
        } else {
            console.log('Migration completed successfully!');
            console.log('Result:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

applySchema();
