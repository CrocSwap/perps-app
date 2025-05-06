import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ isSsrBuild }) => ({
    build: {
        rollupOptions: isSsrBuild
            ? {
                  input: './server/app.ts',
              }
            : undefined,
    },

    plugins: [
        reactRouter(),
        tsconfigPaths(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                maximumFileSizeToCacheInBytes: 3000000,
            },
            manifest: {
                name: 'Ambient Perps',
                short_name: 'Ambient Perps',
                description: 'Ambient Perps description',
                theme_color: '#7371fc',
                background_color: '#7371fc',
                display: 'standalone',
                start_url: '/',
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
}));
