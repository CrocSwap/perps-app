import { useCallback, useRef } from 'react';
import type { Dot } from '../presets/types';
import { TWO_PI } from '../presets/types';

export function useCanvasRenderer() {
    const fadeInDurationRef = useRef(200);
    const fadeInStartTimeRef = useRef<number | null>(null);

    const draw = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            width: number,
            height: number,
            dots: Dot[],
        ) => {
            ctx.clearRect(0, 0, width, height);

            let fadeInMultiplier = 1;
            if (fadeInStartTimeRef.current !== null) {
                const elapsed = Date.now() - fadeInStartTimeRef.current;
                if (elapsed < fadeInDurationRef.current) {
                    fadeInMultiplier = elapsed / fadeInDurationRef.current;
                } else {
                    fadeInStartTimeRef.current = null;
                }
            }

            // Batch dots by color and size to minimize context state changes
            const batches = new Map<string, Dot[]>();

            for (let i = 0; i < dots.length; i++) {
                const dot = dots[i];
                if (dot.opacity > 0.01) {
                    // Round size to nearest 0.5 for batching efficiency
                    const key = `${dot.color}-${Math.round(dot.size * 2) / 2}`;
                    if (!batches.has(key)) {
                        batches.set(key, []);
                    }
                    batches.get(key)!.push(dot);
                }
            }

            // Render each batch with a single fillStyle setting
            batches.forEach((batchDots, key) => {
                const [color, sizeStr] = key.split('-');
                const size = Number.parseFloat(sizeStr);

                ctx.fillStyle = color;

                for (let i = 0; i < batchDots.length; i++) {
                    const dot = batchDots[i];
                    ctx.globalAlpha = Math.min(
                        1,
                        dot.opacity * fadeInMultiplier,
                    );
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, size, 0, TWO_PI);
                    ctx.fill();
                }
            });

            ctx.globalAlpha = 1;
        },
        [],
    );

    const startFadeIn = useCallback(() => {
        fadeInStartTimeRef.current = Date.now();
    }, []);

    return {
        draw,
        startFadeIn,
    };
}
