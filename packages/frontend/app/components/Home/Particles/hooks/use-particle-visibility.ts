import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

export function useParticleVisibility(
    canvasRef: MutableRefObject<HTMLCanvasElement | null>,
) {
    const isVisibleRef = useRef(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisibleRef.current = entry.isIntersecting;
                });
            },
            { threshold: 0.1 },
        );

        observer.observe(canvas);

        return () => {
            observer.disconnect();
        };
    }, [canvasRef]);

    return isVisibleRef;
}
