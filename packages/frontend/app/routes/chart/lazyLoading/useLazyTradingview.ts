export async function loadTradingViewLibrary() {
    if (typeof window === 'undefined') {
        console.warn('[loadTradingView] TradingView not available in SSR.');
        return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).TradingView) return (window as any).TradingView;

    try {
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/tv/charting_library/charting_library.js';
            script.onload = () => resolve();
            script.onerror = () => reject('TradingView failed to load');
            document.head.appendChild(script);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).TradingView || null;
    } catch (err) {
        console.warn(
            '[loadTradingView] Failed to load TradingView library:',
            err,
        );
        return null;
    }
}
