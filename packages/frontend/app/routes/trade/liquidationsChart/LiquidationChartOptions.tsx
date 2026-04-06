import { useLiqChartStore } from '~/stores/LiqChartStore';
import styles from './LiquidationChartOptions.module.css';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LiqLevelsSlider } from '~/components/Liquidations/LiqLevelsSlider/LiqLevelsSlider';
import { useTradingView } from '~/contexts/TradingviewContext';

interface LiquidationChartOptionsProps {}

const LiquidationChartOptions: React.FC<
    LiquidationChartOptionsProps
> = ({}) => {
    const { showLiqOptions, setShowLiqOptions } = useLiqChartStore();

    const { chart } = useTradingView();

    useEffect(() => {
        const docClickListener = (event: MouseEvent) => {
            // setShowLiqOptions(false);
        };
        document.addEventListener('click', docClickListener);
        return () => {
            document.removeEventListener('click', docClickListener);
        };
    }, []);

    useEffect(() => {
        const iframeDocListener = (event: MouseEvent) => {
            const tvIframe = document.querySelector(
                '#tv_chart iframe',
            ) as HTMLIFrameElement;

            //check if click is to trigger show options
            if (tvIframe) {
                const tvIframeDoc = tvIframe.contentDocument;
                if (tvIframeDoc) {
                    const buttonElement = tvIframeDoc.getElementById(
                        'liquidations-settings-button',
                    );
                    if (buttonElement) {
                        const isXInRange =
                            event.clientX >=
                                buttonElement?.getBoundingClientRect().left &&
                            event.clientX <=
                                buttonElement?.getBoundingClientRect().right;
                        const isYInRange =
                            event.clientY >=
                                buttonElement?.getBoundingClientRect().top &&
                            event.clientY <=
                                buttonElement?.getBoundingClientRect().bottom;
                        if (isXInRange && isYInRange) {
                            console.log('>>>>>> button clicked');
                            setShowLiqOptions(true);
                            return;
                        }
                    }
                }
            }

            const clickDocumentX =
                event.clientX + tvIframe.getBoundingClientRect().left;
            const clickDocumentY =
                event.clientY + tvIframe.getBoundingClientRect().top;

            const targetElement = document.getElementById(
                'liquidations-options-wrapper',
            );

            if (targetElement) {
                const isXInRange =
                    clickDocumentX >=
                        targetElement.getBoundingClientRect().left &&
                    clickDocumentX <=
                        targetElement.getBoundingClientRect().right;
                const isYInRange =
                    clickDocumentY >=
                        targetElement.getBoundingClientRect().top &&
                    clickDocumentY <=
                        targetElement.getBoundingClientRect().bottom;
                if (!isXInRange || !isYInRange) {
                    setShowLiqOptions(false);
                }
            }
        };
        if (chart) {
            chart.onChartReady(() => {
                const tvIframe = document.querySelector(
                    '#tv_chart iframe',
                ) as HTMLIFrameElement;

                if (!tvIframe) return;
                const tvIframeDoc = tvIframe.contentDocument;
                if (tvIframeDoc) {
                    tvIframeDoc.addEventListener('click', iframeDocListener);
                }
            });
        }
        return () => {
            const tvIframe = document.querySelector(
                '#tv_chart iframe',
            ) as HTMLIFrameElement;

            if (!tvIframe) return;
            const tvIframeDoc = tvIframe.contentDocument;
            if (tvIframeDoc) {
                tvIframeDoc.removeEventListener('click', iframeDocListener);
            }
        };
    }, [chart]);

    useEffect(() => {
        if (showLiqOptions) {
            const tvIframe = document.querySelector(
                '#tv_chart iframe',
            ) as HTMLIFrameElement;
            if (tvIframe) {
                const tvIframeDoc = tvIframe.contentDocument;
                if (tvIframeDoc) {
                    const targetElement = tvIframeDoc.getElementById(
                        'liquidations-button',
                    );
                    if (targetElement) {
                        const targetElementRect =
                            targetElement.getBoundingClientRect();
                        const liqOptionsWrapper = document.getElementById(
                            'liquidations-options-wrapper',
                        );

                        if (liqOptionsWrapper) {
                            liqOptionsWrapper.style.left = `${targetElementRect.left + tvIframe.getBoundingClientRect().left}px`;
                            liqOptionsWrapper.style.top = `${targetElementRect.bottom + tvIframe.getBoundingClientRect().top}px`;
                        }
                    }
                }
            }
        }
    }, [showLiqOptions]);

    return (
        <>
            {showLiqOptions ? (
                <motion.div
                    id='liquidations-options-wrapper'
                    className={styles.liqOptionsWrapper}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className={styles.liqOptionsHeader}>
                        Liquidation Options
                    </div>
                    <div className={styles.liqOptionsRow}>
                        {/* <div className={styles.liqOptionsLabel}>Levels</div> */}
                        <div className={styles.liqOptionsValue}>
                            <LiqLevelsSlider />
                        </div>
                    </div>
                </motion.div>
            ) : (
                <></>
            )}
        </>
    );
};

export default LiquidationChartOptions;
