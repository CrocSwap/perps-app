declare function plausible(
    eventName: string,
    options?: {
        props?: Record<string, any>;
        callback?: () => void;
    },
): void;
