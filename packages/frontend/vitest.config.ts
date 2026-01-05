import { defineConfig } from 'vitest/config';

// Minimal Vitest config: constrain tests to app/**/*.test.{ts,tsx}
// and use a local cache directory. No Vite plugins are needed here
// since tests use relative imports.
export default defineConfig({
    test: {
        include: ['app/**/*.test.{ts,tsx}'],
        environment: 'node',
        globals: true,
        cache: {
            dir: './.vitest',
        },
    },
});
