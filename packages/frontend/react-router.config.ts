import type { Config } from '@react-router/dev/config';

export default {
    // Use SSR with prerender for the root route to avoid server build file issues
    ssr: true,
    prerender: ['/'],
} satisfies Config;
