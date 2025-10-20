import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';
import { reactRouter } from '@react-router/dev/vite';
import netlifyPlugin from '@netlify/vite-plugin-react-router';

const appName = 'Ambient Perps';
const appDescription = 'A modern, performant app for perpetual contracts.';

export default defineConfig({
    build: {
        outDir: 'build',
        emptyOutDir: true,
        ssr: true,
        rollupOptions: {
            external: ['@noble/hashes'],
        },
    },
    ssr: {
        noExternal: ['@fogo/sessions-sdk-react'],
        target: 'node',
    },
    resolve: {
        alias: [
            { find: '~', replacement: '/app' },
            { find: 'node-fetch', replacement: 'isomorphic-fetch' },
        ],
    },
    plugins: [
        nodePolyfills({
            include: ['buffer'],
            globals: {
                Buffer: true,
            },
        }),
        tsconfigPaths(),
        reactRouter(),
        netlifyPlugin(),
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
