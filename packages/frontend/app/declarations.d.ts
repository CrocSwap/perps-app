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
    export type DraggedElementBaseType = Element;

    export interface SubjectPosition {
        x: number;
        y: number;
    }

    export interface D3DragEvent<
        GElement extends DraggedElementBaseType,
        Datum,
        Subject,
    > {
        sourceEvent: Event;
        subject: Subject;
        target: unknown;
        type: string;
        x: number;
        y: number;
        dx: number;
        dy: number;
        identifier: string | number;
        active: number;
        on: (...args: unknown[]) => void;
    }

    export interface DragBehavior<
        GElement extends DraggedElementBaseType,
        Datum,
        Subject,
    > {
        filter: (fn: (...args: unknown[]) => boolean) => this;
        on: (
            type: string,
            listener: (
                event: D3DragEvent<GElement, Datum, Subject>,
                datum: Datum,
            ) => void,
        ) => this;
    }

    export interface Selection<
        GElement extends Element,
        Datum,
        PElement extends Element,
        PDatum,
    > {
        call: (
            behavior: DragBehavior<GElement, Datum, SubjectPosition>,
        ) => this;
        on: (
            type: string,
            listener: null | ((...args: unknown[]) => void),
        ) => this;
        select: (...args: unknown[]) => any;
        selectAll: (...args: unknown[]) => any;
        append: (...args: unknown[]) => any;
        attr: (...args: unknown[]) => any;
        style: (...args: unknown[]) => any;
        text: (...args: unknown[]) => any;
        data: (...args: unknown[]) => any;
        enter: (...args: unknown[]) => any;
        exit: (...args: unknown[]) => any;
        remove: (...args: unknown[]) => any;
    }

    export type ScaleLinear<Range = number, Output = number> = any;

    export function drag<
        GElement extends DraggedElementBaseType,
        Datum,
        Subject,
    >(): DragBehavior<GElement, Datum, Subject>;

    export function select<GElement extends Element, Datum>(
        element: GElement | string,
    ): Selection<GElement, Datum, Element, unknown>;

    export function min(...args: unknown[]): any;
    export function max(...args: unknown[]): any;
    export function ticks(...args: unknown[]): any;
    export function scaleLinear(...args: unknown[]): any;
    export function scaleTime(...args: unknown[]): any;
    export function scaleOrdinal(...args: unknown[]): any;
    export function scaleSymlog(...args: unknown[]): any;
    export function axisBottom(...args: unknown[]): any;
    export function axisLeft(...args: unknown[]): any;
    export function line(...args: unknown[]): any;
    export function pie(...args: unknown[]): any;
    export const curveStep: any;
    export const curveBasis: any;
}
