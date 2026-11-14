import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'laz-biru': '#3268C3',
        'laz-birudk': '#1f4a9c',
        'laz-birult': '#e8f0fb',
        'laz-birumd': '#5585d4',
        'laz-hijau': '#1a6b3c',
        'laz-hijault': '#e8f5ee',
        'laz-emas': '#c9892a',
        'laz-emaslt': '#fdf3e3',
        'laz-bg': '#f4f6fb',
        'laz-cream': '#f8fafc',
        'laz-white': '#ffffff',
        'laz-border': '#e2e8f0',
        'laz-teks': '#0f1b35',
        'laz-teksmd': '#475569',
        'laz-teksmt': '#94a3b8',
        'laz-red': '#dc2626',
        'laz-redlt': '#fef2f2',
        'brand-50': '#f2f8ea',
        'brand-100': '#e4f0d4',
        'brand-200': '#cbe4b3',
        'brand-300': '#b3d68f',
        'brand-400': '#9bc873',
        'brand-500': '#83b64e',
        'brand-600': '#6ea341',
        'brand-700': '#558033',
        'brand-800': '#416426',
      },
      fontFamily: {
        cabin: ['var(--font-cabin)'],
        albert: ['var(--font-albert)'],
      }
    },
  },
  plugins: [],
};
export default config;
