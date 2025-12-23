import React, { useState } from 'react';
import { useOrderPlacementStore } from '../hooks/useOrderPlacement';

interface PriceActionDropdownProps {
    position: {
        x: number;
        y: number;
        price: number;
    };
    symbolCoin?: string;
    markPx?: number;
    onClose: () => void;
    onBuyLimit: (price: number) => void;
    onSellStop: (price: number) => void;
}

const PriceActionDropdown: React.FC<PriceActionDropdownProps> = ({
    position,
    markPx,
    onClose,
    onBuyLimit,
    onSellStop,
}) => {
    const { activeOrder } = useOrderPlacementStore();

    const isAbove = markPx !== undefined && position.price > markPx;
    const showBuyShortcut = markPx !== undefined && position.price < markPx;
    const showSellShortcut = markPx !== undefined && position.price > markPx;

    // Detect Mac platform
    const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    const displaySize = activeOrder
        ? `${activeOrder.size} ${activeOrder.currency}`
        : '';

    const topOrder = isAbove
        ? {
              label: activeOrder
                  ? `Sell ${displaySize} @ ${position.price.toFixed(2)} limit`
                  : `Sell @ ${position.price.toFixed(2)} limit`,
              shortcut: showSellShortcut
                  ? isMac
                      ? '⌥ ⇧ S'
                      : 'Alt + Shift + S'
                  : undefined,
              onClick: () => {
                  onSellStop(position.price);
                  onClose();
              },
              priority: 1,
          }
        : {
              label: activeOrder
                  ? `Buy ${displaySize} @ ${position.price.toFixed(2)} limit`
                  : `Buy @ ${position.price.toFixed(2)} limit`,
              shortcut: showBuyShortcut
                  ? isMac
                      ? '⌥ ⇧ B'
                      : 'Alt + Shift + B'
                  : undefined,
              onClick: () => {
                  onBuyLimit(position.price);
                  onClose();
              },
              priority: 1,
          };

    const bottomOrder = isAbove
        ? {
              label: activeOrder
                  ? `Buy ${displaySize} @ ${position.price.toFixed(2)} stop`
                  : `Buy @ ${position.price.toFixed(2)} stop`,
              shortcut: showBuyShortcut
                  ? isMac
                      ? '⌥ ⇧ B'
                      : 'Alt + Shift + B'
                  : undefined,
              onClick: () => {
                  onBuyLimit(position.price);
                  onClose();
              },
              priority: 2,
          }
        : {
              label: activeOrder
                  ? `Sell ${displaySize} @ ${position.price.toFixed(2)} stop`
                  : `Sell @ ${position.price.toFixed(2)} stop`,
              shortcut: showSellShortcut
                  ? isMac
                      ? '⌥ ⇧ S'
                      : 'Alt + Shift + S'
                  : undefined,
              onClick: () => {
                  onSellStop(position.price);
                  onClose();
              },
              priority: 2,
          };

    const menuItems = [topOrder, bottomOrder];

    return (
        <>
            <div
                style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    zIndex: 10000,
                    backgroundColor: '#0e0e14',
                    minWidth: '280px',
                    boxShadow: '0 2px 4px #0006',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ padding: '8px 0' }}>
                    {menuItems.map((item, index) => (
                        <MenuItem
                            key={index}
                            label={item.label}
                            shortcut={item.shortcut}
                            onClick={item.onClick}
                        />
                    ))}
                </div>
            </div>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                }}
                onClick={onClose}
            />
        </>
    );
};

const MenuItem: React.FC<{
    label: string;
    shortcut?: string;
    onClick: () => void;
}> = ({ label, shortcut, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                height: '32px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                backgroundColor: isHovered ? '#313030' : 'transparent',
                transition: 'background-color 0.15s',
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <span
                style={{
                    flex: '1 1 auto',
                    color: isHovered ? '#bebdbd' : '#cbcaca',
                    fontSize: '14px',
                    overflowX: 'hidden',
                    paddingLeft: '2px',
                    textAlign: 'left',
                }}
            >
                {label}
            </span>
            {shortcut && (
                <span
                    style={{
                        color: '#525050',
                        fontSize: '12px',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {shortcut}
                </span>
            )}
        </div>
    );
};

export default PriceActionDropdown;
