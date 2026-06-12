import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Minimal Vitest config: constrain tests to app/**/*.test.{ts,tsx}
// and use a local cache directory. No Vite plugins are needed here
// since tests use relative imports.
export default defineConfig({
    plugins: [tsconfigPaths()],
    cacheDir: './.vitest',
    test: {
        include: ['app/**/*.test.{ts,tsx}'],
        environment: 'node',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json-summary', 'html'],
            reportsDirectory: './coverage',
            include: [
                'app/processors/**/*.{ts,tsx}',
                'app/hooks/**/*.{ts,tsx}',
                'app/services/**/*.{ts,tsx}',
                'app/stores/**/*.{ts,tsx}',
                'app/utils/**/*.{ts,tsx}',
            ],
            exclude: [
                'app/**/*.test.{ts,tsx}',
                'app/test-utils/**/*',
                'app/tv/**/*',
                'app/**/*.d.ts',
            ],
        },
    },
});
