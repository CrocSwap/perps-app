import React, { useState } from 'react';
import { useOrderPlacementStore } from '../hooks/useOrderPlacement';
import { t } from 'i18next';

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
                  ? `${t('quickTrade.sellSizeAtLimit', { size: displaySize, price: position.price.toFixed(2) })}`
                  : `${t('quickTrade.sellAtLimit', { price: position.price.toFixed(2) })}`,
              shortcut: showSellShortcut
                  ? isMac
                      ? '⌥ ⇧ S'
                      : 'Alt + Shift + S'
                  : undefined,
              disabled: false,
              onClick: () => {
                  onSellStop(position.price);
                  onClose();
              },
              priority: 1,
          }
        : {
              label: activeOrder
                  ? `${t('quickTrade.buySizeAtLimit', { size: displaySize, price: position.price.toFixed(2) })}`
                  : `${t('quickTrade.buyAtLimit', { price: position.price.toFixed(2) })}`,
              shortcut: showBuyShortcut
                  ? isMac
                      ? '⌥ ⇧ B'
                      : 'Alt + Shift + B'
                  : undefined,
              disabled: false,
              onClick: () => {
                  onBuyLimit(position.price);
                  onClose();
              },
              priority: 1,
          };

    const bottomOrder = isAbove
        ? {
              label: activeOrder
                  ? `${t('quickTrade.buySizeAtStop', { size: displaySize, price: position.price.toFixed(2) })}`
                  : `${t('quickTrade.buyAtStop', { price: position.price.toFixed(2) })}`,
              shortcut: showBuyShortcut
                  ? isMac
                      ? '⌥ ⇧ B'
                      : 'Alt + Shift + B'
                  : undefined,
              disabled: true,
              onClick: () => {
                  onBuyLimit(position.price);
                  onClose();
              },
              priority: 2,
          }
        : {
              label: activeOrder
                  ? `${t('quickTrade.sellSizeAtStop', { size: displaySize, price: position.price.toFixed(2) })}`
                  : `${t('quickTrade.sellAtStop', { price: position.price.toFixed(2) })}`,
              shortcut: showSellShortcut
                  ? isMac
                      ? '⌥ ⇧ S'
                      : 'Alt + Shift + S'
                  : undefined,
              disabled: true,
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
                            disabled={item.disabled}
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
    disabled?: boolean;
}> = ({ label, shortcut, onClick, disabled }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                height: '32px',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                backgroundColor:
                    isHovered && !disabled ? '#313030' : 'transparent',
                transition: 'background-color 0.15s',
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
                opacity: disabled ? 0.5 : 1,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={disabled ? undefined : onClick}
        >
            <span
                style={{
                    flex: '1 1 auto',
                    color: disabled
                        ? '#6b6a6a'
                        : isHovered
                          ? '#bebdbd'
                          : '#cbcaca',
                    fontSize: '14px',
                    overflowX: 'hidden',
                    paddingLeft: '2px',
                    textAlign: 'left',
                }}
            >
                {label}
            </span>
            {disabled && (
                <span
                    style={{
                        color: '#7c5e00',
                        fontSize: '11px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {t('common.comingSoon')}
                </span>
            )}
            {shortcut && !disabled && (
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
