import type { AppLoadContext, EntryContext } from 'react-router';

/**
 * React Router's Vite plugin requires an entry.server module even when SSR is disabled.
 * This stub ensures builds succeed while keeping SSR off.
 */
export default function handleRequest(
    _request: Request,
    _status: number,
    _headers: Headers,
    _context: EntryContext,
    _loadContext: AppLoadContext,
) {
    throw new Error('SSR has been disabled for this app.');
}
