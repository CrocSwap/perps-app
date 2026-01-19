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

declare module 'd3' {
    const d3: any;
    export = d3;
}
