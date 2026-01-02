import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Background Colors
                bg: {
                    primary: 'var(--color-bg-primary)',
                    secondary: 'var(--color-bg-secondary)',
                    tertiary: 'var(--color-bg-tertiary)',
                    hover: 'var(--color-bg-hover)',
                    active: 'var(--color-bg-active)',
                },
                // Text Colors
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    tertiary: 'var(--color-text-tertiary)',
                    muted: 'var(--color-text-muted)',
                },
                // Border Colors
                border: {
                    primary: 'var(--color-border-primary)',
                    secondary: 'var(--color-border-secondary)',
                    glow: 'var(--color-border-glow)',
                },
                // Slack Colors (로고 기반)
                slack: {
                    teal: 'var(--color-slack-teal)',
                    green: 'var(--color-slack-green)',
                    coral: 'var(--color-slack-coral)',
                    yellow: 'var(--color-slack-yellow)',
                },
                // Discord Colors
                discord: {
                    blue: 'var(--color-discord-blue)',
                    glow: 'var(--color-discord-glow)',
                },
                // Brand Colors
                brand: {
                    50: 'var(--color-brand-50)',
                    100: 'var(--color-brand-100)',
                    200: 'var(--color-brand-200)',
                    300: 'var(--color-brand-300)',
                    400: 'var(--color-brand-400)',
                    500: 'var(--color-brand-500)',
                    600: 'var(--color-brand-600)',
                    700: 'var(--color-brand-700)',
                    800: 'var(--color-brand-800)',
                    900: 'var(--color-brand-900)',
                },
                // Accent Colors
                accent: {
                    teal: 'var(--color-accent-teal)',
                    coral: 'var(--color-accent-coral)',
                    sage: 'var(--color-accent-sage)',
                    amber: 'var(--color-accent-amber)',
                },
                // Functional Colors
                success: 'var(--color-success)',
                error: 'var(--color-error)',
                warning: 'var(--color-warning)',
                info: 'var(--color-info)',
            },
            boxShadow: {
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                xl: 'var(--shadow-xl)',
                'glow-sm': 'var(--glow-sm)',
                'glow-md': 'var(--glow-md)',
                'glow-lg': 'var(--glow-lg)',
            },
        },
    },
    plugins: [],
};

export default config;
