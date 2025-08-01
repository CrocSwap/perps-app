import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, type PluginOption } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

const appName = 'Ambient Perps';
const appDescription = 'A modern, performant app for perpetual contracts.';

export default defineConfig({
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router',
            'react-router-dom',
            '@remix-run/router',
        ],
        esbuildOptions: {
            // This helps avoid "Cannot read property 'x' of undefined" errors
            define: {
                global: 'globalThis',
            },
        },
    },
    build: {
        ssr: false,
        outDir: 'build/client',
        sourcemap: false,
        minify: 'esbuild',
        target: 'esnext',
        reportCompressedSize: false,
        cssCodeSplit: true,
        commonjsOptions: {
            include: /node_modules/,
            transformMixedEsModules: true,
        },
        rollupOptions: {
            onwarn(warning, defaultHandler) {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return;
                }
                defaultHandler(warning);
            },
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('sessions')) {
                            return 'vendor_sessions';
                        }
                        return 'vendor';
                    }
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash][extname]',
            },
        },
        chunkSizeWarningLimit: 1000,
    },
    ssr: {
        noExternal: ['@fogo/sessions-sdk-react'],
    },
    resolve: {
        alias: {
            'node-fetch': 'isomorphic-fetch',
        },
    },
    plugins: [
        nodePolyfills({
            include: ['buffer'],
            globals: {
                Buffer: true,
            },
        }),
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
