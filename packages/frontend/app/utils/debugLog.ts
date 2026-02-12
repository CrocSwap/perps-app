// Global debug utility that won't be removed by console filtering in production
// Use this for important debugging that needs to persist in production builds

declare global {
    interface Window {
        debugLog: (...args: any[]) => void;
    }
}

// Create a global debug function that always logs
if (typeof window !== 'undefined') {
    window.debugLog = (...args: any[]) => {
        console.log(...args);
    };
}

// Export for use in components
export const debugLog = (...args: any[]) => {
    if (typeof window !== 'undefined' && window.debugLog) {
        window.debugLog(...args);
    } else {
        console.log(...args);
    }
};
