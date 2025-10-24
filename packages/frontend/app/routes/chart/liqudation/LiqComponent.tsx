import LiquidationsChart from '~/routes/trade/liquidationsChart/LiquidationOBChart';
import { useLiqudationLines } from './hooks/useLiquidationLines';
import LiqLineTooltip from './LiqLinesTooltip';
import LiqudationLines from './LiqudationLines';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useEffect, useState } from 'react';

export interface LiqProps {
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    canvasWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasSize: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData: any;
    zoomChanged: boolean;
}

const LiqComponent = ({
    overlayCanvasRef,
    canvasWrapperRef,
    canvasSize,
    scaleData,
    zoomChanged,
}: LiqProps) => {
    const lines = useLiqudationLines(scaleData);

    const { highResBuys, highResSells, liqBuys, liqSells } =
        useOrderBookStore();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [overlayLiqCanvasAttr, setOverlayLiqCanvasAttr] = useState<any>();

    useEffect(() => {
        const canvasRect = overlayCanvasRef.current?.getBoundingClientRect();

        if (canvasRect) {
            const dpr = window.devicePixelRatio || 1;

            setOverlayLiqCanvasAttr({
                top: canvasRect.top,
                left: canvasRect.left,
                height: canvasSize.height / dpr,
                width: canvasSize.width / dpr,
            });
        }
    }, [canvasSize]);

    return (
        <>
            {overlayLiqCanvasAttr && (
                <div
                    id='liq-mobile'
                    style={{
                        position: 'absolute',
                        top: overlayLiqCanvasAttr.top,
                        left: overlayLiqCanvasAttr.left,
                        pointerEvents: 'none',
                        width: overlayLiqCanvasAttr.width,
                        height: overlayLiqCanvasAttr.height,
                        overflow: 'hidden',
                    }}
                >
                    <LiquidationsChart
                        buyData={highResBuys}
                        sellData={highResSells}
                        liqBuys={liqBuys}
                        liqSells={liqSells}
                        width={overlayLiqCanvasAttr.width}
                        height={overlayLiqCanvasAttr.height}
                        scaleData={scaleData}
                        location={'liqMobile'}
                    />
                </div>
            )}
            <LiqLineTooltip
                canvasWrapperRef={canvasWrapperRef}
                overlayCanvasRef={overlayCanvasRef}
                scaleData={scaleData}
                lines={lines}
            />
            <LiqudationLines
                canvasSize={canvasSize}
                overlayCanvasRef={overlayCanvasRef}
                canvasWrapperRef={canvasWrapperRef}
                scaleData={scaleData}
                zoomChanged={zoomChanged}
                lines={lines}
            />
        </>
    );
};

export default LiqComponent;
