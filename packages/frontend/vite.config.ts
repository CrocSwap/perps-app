import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

const appName = 'Ambient Perps';
const appDescription = 'A modern, performant app for perpetual contracts.';

export default defineConfig(({ mode }) => ({
    // Optimize dependency pre-bundling
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router',
            'zustand',
            'd3',
            'd3fc',
            '@solana/web3.js',
        ],
        esbuildOptions: {
            // Force proper CommonJS interop for default exports
            mainFields: ['module', 'main'],
            resolveExtensions: [
                '.mjs',
                '.js',
                '.mts',
                '.ts',
                '.jsx',
                '.tsx',
                '.json',
            ],
        },
    },
    build: {
        outDir: 'build',
        emptyOutDir: true,
        sourcemap: false, // Disable sourcemaps in production for smaller bundle
        minify: 'terser', // Use terser for better compression
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.debug'], // Remove specific console methods
            },
        },
        cssCodeSplit: true, // Enable CSS code splitting
        commonjsOptions: {
            // Ensure proper default export handling for CommonJS modules
            transformMixedEsModules: true,
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor chunks for better caching
                    'react-vendor': ['react', 'react-dom', 'react-router'],
                    'd3-vendor': ['d3', 'd3fc'],
                    'i18n-vendor': [
                        'i18next',
                        'react-i18next',
                        'i18next-browser-languagedetector',
                    ],
                    'animation-vendor': ['framer-motion'],
                },
                // Optimize chunk file names for better caching
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        chunkSizeWarningLimit: 1000, // Increase limit for large dependencies
        reportCompressedSize: false, // Disable to speed up build
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
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
            workbox: {
                maximumFileSizeToCacheInBytes: 5_000_000,
                // Precache JS, CSS, images, and fonts for offline support
                globPatterns:
                    mode === 'development'
                        ? []
                        : ['**/*.{js,css,png,svg,woff2,ttf}'],
                // Don't cache service worker files or manifest
                globIgnores: [
                    '**/sw.js',
                    '**/workbox-*.js',
                    '**/registerSW.js',
                    '**/manifest.webmanifest',
                ],
                // Enable offline navigation fallback to index.html
                navigateFallback: '/index.html',
                // Only use fallback for same-origin navigation requests (not API calls)
                navigateFallbackDenylist: [/^\/api/, /^\/ws/, /\.json$/],
                // Skip waiting and claim clients immediately on update
                skipWaiting: true,
                clientsClaim: true,
                // Clean up old caches
                cleanupOutdatedCaches: true,
                runtimeCaching: [
                    // Cache index.html with NetworkFirst for offline support
                    {
                        urlPattern: ({ request, url }) =>
                            request.mode === 'navigate' &&
                            url.origin === self.location.origin,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'html-cache',
                            networkTimeoutSeconds: 3,
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 24 * 60 * 60, // 1 day
                            },
                        },
                    },
                    // Cache images with StaleWhileRevalidate
                    {
                        urlPattern: ({ url }) =>
                            url.origin === self.location.origin &&
                            url.pathname.startsWith('/images/'),
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                            },
                        },
                    },
                    // Cache fonts with CacheFirst (they rarely change)
                    {
                        urlPattern: ({ url }) =>
                            url.origin === self.location.origin &&
                            url.pathname.startsWith('/fonts/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'font-cache',
                            expiration: {
                                maxEntries: 20,
                                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                            },
                        },
                    },
                ],
            },
            devOptions: {
                enabled:
                    mode === 'development' &&
                    process.env.VITE_PWA_DEV === 'true',
            },
            manifest: {
                name: appName,
                short_name: appName,
                description: appDescription,
                theme_color: '#7371fc',
                background_color: '#06060c',
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
}));
