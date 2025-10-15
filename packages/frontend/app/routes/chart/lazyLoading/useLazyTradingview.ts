export async function loadTradingView() {
    if (typeof window === 'undefined') {
        console.warn('[loadTradingView] TradingView not available in SSR.');
        return { widget: null };
    }

    try {
        if (!(window as any).TradingView) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = '/tv/charting_library/charting_library.js';
                script.onload = () => resolve();
                script.onerror = (err) => reject(err);
                document.head.appendChild(script);
            });
        }

        return { widget: (window as any).TradingView?.widget };
    } catch (err) {
        console.error(
            '[loadTradingView] Failed to load TradingView library:',
            err,
        );
        return { widget: null };
    }
}
