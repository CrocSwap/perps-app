import OrderLines from '../orders/OrderLines';
import OverlayCanvasLayer from './overlayCanvasLayer';

const OrderLinesOverlayCanvas: React.FC = () => {
    return (
        <OverlayCanvasLayer id='order-overlay' zIndex={5}>
            {({
                canvasRef,
                canvasSize,
                scaleData,
                mousePositionRef,
                zoomChanged,
            }) => (
                <OrderLines
                    overlayCanvasRef={canvasRef}
                    canvasSize={canvasSize}
                    scaleData={scaleData}
                    overlayCanvasMousePositionRef={mousePositionRef}
                    zoomChanged={zoomChanged}
                />
            )}
        </OverlayCanvasLayer>
    );
};

export default OrderLinesOverlayCanvas;
