import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './symbolinfofield.module.css';

import { motion } from 'framer-motion';
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';
import Tooltip from '~/components/Tooltip/Tooltip';
import { LuCircleHelp, LuX } from 'react-icons/lu';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useMobile } from '~/hooks/useMediaQuery';
import { createPortal } from 'react-dom';

interface SymbolInfoFieldProps {
    label: string;
    value: string;
    lastWsChange?: number;
    type?: 'positive' | 'negative';
    valueClass?: string;
    skeleton?: boolean;
    tooltipContent?: ReactNode;
}

const SymbolInfoField: React.FC<SymbolInfoFieldProps> = ({
    label,
    value,
    lastWsChange,
    type,
    valueClass,
    skeleton = false,
    tooltipContent,
}) => {
    const { getBsColor } = useAppSettings();
    const [showMobilePopup, setShowMobilePopup] = useState(false);
    const isMobile = useMobile();

    const getValueColor = () => {
        if (type === 'positive') {
            return getBsColor().buy;
        }
        if (type === 'negative') {
            return getBsColor().sell;
        }
        return 'var(--text1)';
    };

    const handleFieldClick = () => {
        if (isMobile && tooltipContent) {
            setShowMobilePopup(true);
        }
    };

    const renderValue = () => {
        if (skeleton) {
            return (
                <div className={`${styles.symbolInfoFieldValue} ${valueClass}`}>
                    <SkeletonNode height='20px' width='70%' />
                </div>
            );
        }
        if (lastWsChange) {
            return (
                <motion.div
                    key={lastWsChange}
                    className={`${styles.symbolInfoFieldValue} ${valueClass}`}
                    initial={{
                        color:
                            lastWsChange > 0
                                ? getBsColor().buy
                                : lastWsChange < 0
                                  ? getBsColor().sell
                                  : 'var(--text1)',
                    }}
                    animate={{ color: 'var(--text1)' }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                >
                    {value}
                </motion.div>
            );
        }
        return (
            <div
                className={`${styles.symbolInfoFieldValue} ${valueClass}`}
                style={{ color: getValueColor() }}
            >
                {value}
            </div>
        );
    };

    return (
        <>
            <div className={styles.symbolInfoFieldWrapper}>
                {/* Desktop: Use existing Tooltip component */}
                {!isMobile ? (
                    <Tooltip content={tooltipContent} position='bottom'>
                        <div className={`${styles.symbolInfoField}`}>
                            <div className={styles.symbolInfoFieldLabel}>
                                {label}
                                {tooltipContent && (
                                    <div className={styles.tooltip}>
                                        <LuCircleHelp size={12} />
                                    </div>
                                )}
                            </div>
                            {renderValue()}
                        </div>
                    </Tooltip>
                ) : (
                    /* Mobile: Simple click to show bottom popup */
                    <div
                        className={`${styles.symbolInfoField} ${isMobile && tooltipContent ? styles.mobileClickable : ''}`}
                        onClick={handleFieldClick}
                    >
                        <div className={styles.symbolInfoFieldLabel}>
                            {label}
                            {tooltipContent && (
                                <div className={styles.tooltip}>
                                    <LuCircleHelp size={12} />
                                </div>
                            )}
                        </div>
                        {renderValue()}
                    </div>
                )}
            </div>

            {/* Mobile bottom popup - rendered as portal to escape container constraints */}
            {showMobilePopup &&
                createPortal(
                    <>
                        {/* Backdrop */}
                        <div
                            className={styles.mobilePopupBackdrop}
                            onClick={() => setShowMobilePopup(false)}
                        />

                        {/* Simple bottom popup */}
                        <div className={styles.mobilePopup}>
                            {tooltipContent}
                        </div>
                    </>,
                    document.body,
                )}
        </>
    );
};

export default SymbolInfoField;
