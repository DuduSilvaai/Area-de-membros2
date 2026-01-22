const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // remove quotes
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.error('Error loading .env.local', e);
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('Running chat fix migration...');
        const sqlContent = fs.readFileSync(path.join(__dirname, 'fix_chat_admin_insert.sql'), 'utf8');

        let { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.log('exec_sql failed, trying without rpc if possible (not possible with js client usually)...');
            console.error('Migration error:', error);
        } else {
            console.log('Migration completed successfully!');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

runMigration();
