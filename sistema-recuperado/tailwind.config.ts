import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    main: "var(--primary-main)",
                    hover: "var(--primary-hover)",
                    subtle: "var(--primary-subtle)",
                },
                background: {
                    default: "var(--bg-default)",
                    canvas: "var(--bg-canvas)",
                    surface: "var(--bg-surface)",
                    sidebar: "var(--bg-sidebar)",
                },
                text: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                    disabled: "var(--text-disabled)",
                    "on-primary": "var(--text-on-primary)",
                },
                status: {
                    success: "var(--status-success)",
                    warning: "var(--status-warning)",
                    error: "var(--status-error)",
                    info: "var(--status-info)",
                },
                border: "var(--border-color)",
            },
            spacing: {
                xs: "var(--spacing-xs)",
                sm: "var(--spacing-sm)",
                md: "var(--spacing-md)",
                lg: "var(--spacing-lg)",
                xl: "var(--spacing-xl)",
                xxl: "var(--spacing-xxl)",
            },
            borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
                full: "var(--radius-full)",
            },
            boxShadow: {
                soft: "var(--shadow-soft)",
                medium: "var(--shadow-medium)",
                card: "var(--shadow-card)",
                floating: "var(--shadow-floating)",
            },
            fontFamily: {
                sans: "var(--font-family)",
            },
        },
    },
    plugins: [],
};
export default config;
