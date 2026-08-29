import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useMobile } from '~/hooks/useMediaQuery';
import LiquidationsChart from '~/routes/trade/liquidationsChart/LiquidationOBChart';
import { useAppStateStore } from '~/stores/AppStateStore';
import { LiqChartTabType, useLiqChartStore } from '~/stores/LiqChartStore';
import { useLiquidationStore } from '~/stores/LiquidationStore';
import { useLiqudationLines } from './hooks/useLiquidationLines';
import LiqLineTooltip from './LiqLinesTooltip';
import LiqudationLines from './LiqudationLines';

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

    const { activeTab, showLiqOverlayAlways } = useLiqChartStore();
    const isMobile = useMobile();

    const { buyLiqs, sellLiqs } = useLiquidationStore();
    const { liquidationsActive } = useAppStateStore();
    const liquidationsActiveRef = useRef(liquidationsActive);
    liquidationsActiveRef.current = liquidationsActive;

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
                    {(activeTab !== LiqChartTabType.Distribution ||
                        showLiqOverlayAlways ||
                        isMobile) && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            <LiquidationsChart
                                chartMode={'distribution'}
                                buyData={buyLiqs}
                                sellData={sellLiqs}
                                liqBuys={[]}
                                liqSells={[]}
                                width={overlayLiqCanvasAttr.width}
                                height={overlayLiqCanvasAttr.height}
                                scaleData={scaleData}
                                location={'liqMobile'}
                            />
                        </motion.div>
                    )}
                </div>
            )}
        </>
    );
};

export default LiqComponent;
