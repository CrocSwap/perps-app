import React from 'react';
import LimitOrderPlacement from './LimitOrderPlacement';
import OverlayCanvasLayer from './overlayCanvasLayer';

const LimitOrderPlacementCanvas: React.FC = () => {
    return (
        <OverlayCanvasLayer
            id='limit-order-placement-overlay'
            zIndex={10}
            pointerEvents='none'
        >
            {({ canvasRef, canvasSize, scaleData, mousePositionRef }) => (
                <LimitOrderPlacement
                    overlayCanvasRef={canvasRef}
                    canvasSize={canvasSize}
                    scaleData={scaleData}
                    overlayCanvasMousePositionRef={mousePositionRef}
                />
            )}
        </OverlayCanvasLayer>
    );
};

export default LimitOrderPlacementCanvas;
