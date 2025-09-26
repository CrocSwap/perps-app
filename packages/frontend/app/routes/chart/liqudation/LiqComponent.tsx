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
    return (
        <>
            <LiqLineTooltip
                canvasSize={canvasSize}
                canvasWrapperRef={canvasWrapperRef}
                overlayCanvasRef={overlayCanvasRef}
                scaleData={scaleData}
                zoomChanged={zoomChanged}
            />
            <LiqudationLines
                canvasSize={canvasSize}
                overlayCanvasRef={overlayCanvasRef}
                canvasWrapperRef={canvasWrapperRef}
                scaleData={scaleData}
                zoomChanged={zoomChanged}
            />
        </>
    );
};

export default LiqComponent;
