export async function loadTradingView() {
    // If running in SSR or there is no window, skip loading
    if (typeof window === 'undefined') {
        console.warn(
            '[loadTradingView] TradingView is not loaded in SSR environment.',
        );
        return { widget: null };
    }

    try {
        const modulePath = '/app/tv/charting_library/charting_library.js';
        await import(/* @vite-ignore */ modulePath);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const widget = (window as any).TradingView?.widget;

        return { widget: widget };
    } catch {
        console.warn(
            '[loadTradingView] TradingView library not found — skipping chart initialization.',
        );
        return { widget: null };
    }
}
