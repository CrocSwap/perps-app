declare function plausible(
    eventName: string,
    options?: {
        props?: Record<string, any>;
        callback?: () => void;
    },
): void;

declare module '*?routes' {
    import type { RouteObject } from 'react-router';

    const routes: RouteObject[];
    export default routes;
}
