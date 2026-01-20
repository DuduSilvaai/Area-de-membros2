// PM2 Ecosystem Configuration for Next.js 16 Production Deployment
// Documentation: https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
    apps: [
        {
            // Application name (used in PM2 commands: pm2 start/stop/restart sistema-recuperado)
            name: 'sistema-recuperado',

            // Start command - uses npm start which runs: next start -H 0.0.0.0 -p 5000
            script: 'npm',
            args: 'start',

            // Working directory where the app is located
            cwd: '/var/www/sistema-recuperado',

            // Number of instances (use 'max' for all CPU cores, or specific number)
            // For VPS with limited resources, 1-2 instances recommended
            instances: 1,

            // Enable cluster mode for load balancing (optional for small VPS)
            exec_mode: 'fork',

            // Auto-restart if app crashes
            autorestart: true,

            // Watch for file changes (disable in production for performance)
            watch: false,

            // Maximum memory before restart (adjust based on VPS RAM)
            max_memory_restart: '500M',

            // Environment variables for production
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000,
                // Supabase credentials (will be loaded from .env.production on server)
                // Do NOT commit actual keys here - they are read from environment
            },

            // Restart delay to prevent rapid restart loops
            restart_delay: 5000,

            // Maximum restarts within a time window before stopping
            max_restarts: 10,
            min_uptime: '10s',

            // Logging configuration
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: '/var/log/pm2/sistema-recuperado-error.log',
            out_file: '/var/log/pm2/sistema-recuperado-out.log',
            merge_logs: true,

            // Graceful shutdown settings
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
        },
    ],
};
