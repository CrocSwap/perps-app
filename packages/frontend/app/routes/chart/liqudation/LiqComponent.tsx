import LiqudationLines from './LiqudationLines';

export interface LiqProps {
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasSize: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData: any;
    zoomChanged: boolean;
}

const LiqComponent = ({
    overlayCanvasRef,
    canvasSize,
    scaleData,
    zoomChanged,
}: LiqProps) => {
    return (
        <LiqudationLines
            canvasSize={canvasSize}
            overlayCanvasRef={overlayCanvasRef}
            scaleData={scaleData}
            zoomChanged={zoomChanged}
        />
    );
};

export default LiqComponent;
