// Global debug utility that won't be removed by console filtering in production
// Use this for important debugging that needs to persist in production builds

declare global {
    interface Window {
        debugLog: (...args: unknown[]) => void;
    }
}

const getConsole = (): Console | undefined => {
    try {
        return Function('return globalThis.console')() as Console;
    } catch {
        return undefined;
    }
};

const logWithConsole = (...args: unknown[]) => {
    const consoleRef = getConsole();
    consoleRef?.log?.(...args);
};

// Create a global debug function that always logs
if (typeof window !== 'undefined') {
    window.debugLog = (...args: unknown[]) => {
        logWithConsole(...args);
    };
}

// Export for use in components
export const debugLog = (...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.debugLog) {
        window.debugLog(...args);
    } else {
        logWithConsole(...args);
    }
};
