/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./access_logs_page/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                // Mozart Brand Colors
                'mozart-pink': '#FF0080',
                'mozart-pink-dark': '#d6006c',
                // Enterprise Dark Palette
                'dark-bg': '#0a0a0a',
                'dark-surface': '#121212',
                'dark-card': '#18181b',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'aurora-1': 'aurora1 12s infinite alternate',
                'aurora-2': 'aurora2 18s infinite alternate',
                'aurora-3': 'aurora3 15s infinite alternate',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                aurora1: {
                    '0%': { transform: 'translate(0, 0) scale(1)' },
                    '100%': { transform: 'translate(50px, 50px) scale(1.1)' },
                },
                aurora2: {
                    '0%': { transform: 'translate(0, 0) scale(1)' },
                    '100%': { transform: 'translate(-30px, 40px) scale(1.2)' },
                },
                aurora3: {
                    '0%': { transform: 'translate(0, 0) scale(1)' },
                    '100%': { transform: 'translate(40px, -40px) scale(0.9)' },
                },
            },
        },
    },
    plugins: [],
};
