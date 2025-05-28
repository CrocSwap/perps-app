import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, type PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

const appName = 'Ambient Perps';
const appDescription = 'A modern, performant app for perpetual contracts.';

export default defineConfig({
    build: {
        ssr: false, // Explicitly disable SSR
        outDir: 'dist/client', // Clear client output directory
        rollupOptions: {
            input: 'src/client.tsx', // Point to client entry (if different)
        },
    },
    plugins: [
        tsconfigPaths() as PluginOption,
        reactRouter(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                maximumFileSizeToCacheInBytes: 3_000_000,
                globPatterns: ['**/*.{js,css,html,png,svg}'], // Add asset patterns
            },
            devOptions: {
                enabled: process.env.NODE_ENV === 'development',
            },
            manifest: {
                name: appName,
                short_name: appName,
                description: appDescription,
                theme_color: '#7371fc',
                background_color: '#7371fc',
                display: 'standalone',
                start_url: '/',
                id: '/',
                lang: 'en',
                orientation: 'portrait',
                icons: [
                    {
                        src: '/images/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/images/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: '/images/pwa-64x64.png',
                        sizes: '64x64',
                        type: 'image/png',
                    },
                    {
                        src: '/images/maskable-icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable',
                    },
                ],
            },
        }),
    ],
});
