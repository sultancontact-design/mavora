import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'var(--background)',
                        foreground: 'var(--foreground)',
                        card: {
                                DEFAULT: 'var(--card)',
                                foreground: 'var(--card-foreground)'
                        },
                        popover: {
                                DEFAULT: 'var(--popover)',
                                foreground: 'var(--popover-foreground)'
                        },
                        primary: {
                                DEFAULT: 'var(--primary)',
                                foreground: 'var(--primary-foreground)'
                        },
                        secondary: {
                                DEFAULT: 'var(--secondary)',
                                foreground: 'var(--secondary-foreground)'
                        },
                        muted: {
                                DEFAULT: 'var(--muted)',
                                foreground: 'var(--muted-foreground)'
                        },
                        accent: {
                                DEFAULT: 'var(--accent)',
                                foreground: 'var(--accent-foreground)'
                        },
                        destructive: {
                                DEFAULT: 'var(--destructive)',
                                foreground: 'var(--destructive-foreground)'
                        },
                        border: 'var(--border)',
                        input: 'var(--input)',
                        ring: 'var(--ring)',
                        chart: {
                                '1': 'var(--chart-1)',
                                '2': 'var(--chart-2)',
                                '3': 'var(--chart-3)',
                                '4': 'var(--chart-4)',
                                '5': 'var(--chart-5)'
                        },
                        // Modern Moroccan Theme Colors
                        teal: {
                                'DEFAULT': '#0D9488',
                                light: '#14B8A6',
                                dark: '#0F766E',
                                50: '#F0FDFA',
                                100: '#CCFBF1',
                                200: '#99F6E4',
                                300: '#5EEAD4',
                                400: '#2DD4BF',
                                500: '#14B8A6',
                                600: '#0D9488',
                                700: '#0F766E',
                                800: '#115E59',
                                900: '#134E4A',
                                foreground: '#FFFFFF'
                        },
                        violet: {
                                'DEFAULT': '#7C3AED',
                                light: '#8B5CF6',
                                dark: '#6D28D9',
                                50: '#F5F3FF',
                                100: '#EDE9FE',
                                200: '#DDD6FE',
                                300: '#C4B5FD',
                                400: '#A78BFA',
                                500: '#8B5CF6',
                                600: '#7C3AED',
                                700: '#6D28D9',
                                800: '#5B21B6',
                                900: '#4C1D95',
                                foreground: '#FFFFFF'
                        },
                        gold: {
                                'DEFAULT': '#F59E0B',
                                light: '#FBBF24',
                                dark: '#D97706',
                                50: '#FFFBEB',
                                100: '#FEF3C7',
                                200: '#FDE68A',
                                300: '#FCD34D',
                                400: '#FBBF24',
                                500: '#F59E0B',
                                600: '#D97706',
                                700: '#B45309',
                                800: '#92400E',
                                900: '#78350F',
                                foreground: '#1F2937'
                        },
                        coral: {
                                'DEFAULT': '#F97316',
                                light: '#FB923C',
                                dark: '#EA580C',
                                50: '#FFF7ED',
                                100: '#FFEDD5',
                                200: '#FED7AA',
                                300: '#FDBA74',
                                400: '#FB923C',
                                500: '#F97316',
                                600: '#EA580C',
                                700: '#C2410C',
                                800: '#9A3412',
                                900: '#7C2D12',
                                foreground: '#FFFFFF'
                        },
                        emerald: {
                                'DEFAULT': '#10B981',
                                light: '#34D399',
                                dark: '#059669',
                                50: '#ECFDF5',
                                100: '#D1FAE5',
                                200: '#A7F3D0',
                                300: '#6EE7B7',
                                400: '#34D399',
                                500: '#10B981',
                                600: '#059669',
                                700: '#047857',
                                800: '#065F46',
                                900: '#064E3B',
                                foreground: '#FFFFFF'
                        },
                        rose: {
                                'DEFAULT': '#EF4444',
                                light: '#F87171',
                                dark: '#DC2626',
                                50: '#FFF1F2',
                                100: '#FFE4E6',
                                200: '#FECDD3',
                                300: '#FDA4AF',
                                400: #F87171,
                                500: '#EF4444',
                                600: '#DC2626',
                                700: '#B91C1C',
                                800: '#991B1B',
                                900: '#7F1D1D',
                                foreground: '#FFFFFF'
                        }
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)',
                        xl: 'calc(var(--radius) + 4px)',
                        '2xl': 'calc(var(--radius) + 8px)',
                        '3xl': 'calc(var(--radius) + 12px)'
                },
                fontFamily: {
                        sans: ['var(--font-tajawal)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
                        arabic: ['var(--font-tajawal)', 'system-ui', 'sans-serif'],
                        latin: ['var(--font-inter)', 'system-ui', 'sans-serif']
                },
                boxShadow: {
                        'teal': 'var(--shadow-teal)',
                        'violet': 'var(--shadow-violet)',
                        'gold': 'var(--shadow-gold)',
                        'coral': 'var(--shadow-coral)'
                }
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
