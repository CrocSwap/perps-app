import LiqComponent from '../liqudation/LiqComponent';
import OverlayCanvasLayer from './overlayCanvasLayer';

const LiquidationOverlayCanvas: React.FC = () => {
    return (
        <OverlayCanvasLayer id='liquidation-overlay' zIndex={5}>
            {({
                canvasRef,
                canvasWrapperRef,
                canvasSize,
                scaleData,
                zoomChanged,
            }) => (
                <LiqComponent
                    overlayCanvasRef={canvasRef}
                    canvasWrapperRef={canvasWrapperRef}
                    canvasSize={canvasSize}
                    scaleData={scaleData}
                    zoomChanged={zoomChanged}
                />
            )}
        </OverlayCanvasLayer>
    );
};

export default LiquidationOverlayCanvas;
