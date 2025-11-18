import { useLiqudationLines } from './hooks/useLiquidationLines';
import LiqLineTooltip from './LiqLinesTooltip';
import LiqudationLines, { type HorizontalLineData } from './LiqudationLines';

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
        </>
    );
};

export default LiqComponent;
