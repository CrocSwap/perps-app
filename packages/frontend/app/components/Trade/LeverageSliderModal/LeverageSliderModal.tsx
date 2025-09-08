import { useCallback, useEffect, useState } from 'react';
// import { LuCircleHelp } from 'react-icons/lu';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
// import Tooltip from '~/components/Tooltip/Tooltip';
import { calcLeverageFloor } from '@crocswap-libs/ambient-ember';
import { useSetUserMarginService } from '~/hooks/useSetUserMarginService';
import { useUnifiedMarginData } from '~/hooks/useUnifiedMarginData';
import { useLeverageStore } from '~/stores/LeverageStore';
import { useNotificationStore } from '~/stores/NotificationStore';
import { blockExplorer, BTC_MAX_LEVERAGE } from '~/utils/Constants';
import LeverageSlider from '../OrderInput/LeverageSlider/LeverageSlider';
import styles from './LeverageSliderModal.module.css';

interface LeverageSliderModalProps {
    currentLeverage: number;
    onClose: () => void;
    maxLeverage?: number;
    onConfirm?: (newLeverage: number) => void;
}

export default function LeverageSliderModal({
    currentLeverage,
    maxLeverage,
    onClose,
    onConfirm,
}: LeverageSliderModalProps) {
    const [value, setValue] = useState<number>(currentLeverage);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState<
        'idle' | 'pending' | 'success' | 'failed'
    >('idle');

    const notificationStore = useNotificationStore();
    const setPreferredLeverage = useLeverageStore(
        (state) => state.setPreferredLeverage,
    );
    const { marginBucket } = useUnifiedMarginData();
    const [leverageFloor, setLeverageFloor] = useState<number>();

    const { isLoading, error, executeSetUserMargin } =
        useSetUserMarginService();

    useEffect(() => {
        if (!marginBucket) {
            setLeverageFloor(undefined);
            return;
        }
        const leverageFloor = calcLeverageFloor(marginBucket, 10_000_000n);
        const newLeverageFloor = 10_000 / Number(leverageFloor);
        setLeverageFloor(Math.min(newLeverageFloor, BTC_MAX_LEVERAGE));
    }, [marginBucket]);

    // const currentMarket = useLeverageStore((state) => state.currentMarket);

    // Update local state if currentLeverage prop changes
    useEffect(() => {
        setValue(Math.min(currentLeverage, BTC_MAX_LEVERAGE));
    }, [currentLeverage]);

    const handleSliderChange = (newValue: number) => {
        // Update the leverage in the store immediately as the slider changes
        setValue(Math.min(newValue, BTC_MAX_LEVERAGE));
    };

    const handleSliderClick = (newLeverage: number) => {
        setValue(newLeverage);
    };

    const handleConfirm = useCallback(async () => {
        setIsProcessing(true);
        setTransactionStatus('pending');

        try {
            // Calculate userImBps from leverage value
            const userImBps = Math.floor(10000 / value);

            console.log(
                '🚀 Setting user margin with leverage:',
                value,
                'userImBps:',
                userImBps,
            );

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () =>
                        reject(
                            new Error('Transaction timed out after 15 seconds'),
                        ),
                    15000,
                );
            });

            // Race between the transaction and the timeout
            const result = await Promise.race([
                executeSetUserMargin({ userSetImBps: userImBps }),
                timeoutPromise,
            ]);

            console.log('✅ Transaction result:', result);

            if (result.success) {
                setTransactionStatus('success');

                // Update local state
                setPreferredLeverage(value);
                if (onConfirm) {
                    onConfirm(value);
                }

                // Show success notification
                notificationStore.add({
                    title: 'Leverage Updated',
                    message: `Successfully set leverage to ${value.toFixed(1)}x`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });

                // Close modal on success
                onClose();
            } else {
                setTransactionStatus('failed');

                // Show error notification and close modal
                notificationStore.add({
                    title: 'Transaction Failed',
                    message: result.error || 'Failed to update leverage',
                    icon: 'error',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
                onClose();
            }
        } catch (error) {
            setTransactionStatus('failed');
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to update leverage';

            // Show error notification
            notificationStore.add({
                title: 'Transaction Error',
                message: errorMessage,
                icon: 'error',
            });
        } finally {
            setIsProcessing(false);
        }
    }, [
        value,
        executeSetUserMargin,
        setPreferredLeverage,
        onConfirm,
        onClose,
        notificationStore,
    ]);

    const [isLeverageBeingDragged, setIsLeverageBeingDragged] =
        useState<boolean>(false);

    return (
        <Modal title='Adjust Leverage' close={onClose}>
            <div className={styles.leverageSliderContainer}>
                {/* Use the enhanced LeverageSlider component in modal mode */}
                <div className={styles.sliderSection}>
                    <LeverageSlider
                        value={value}
                        onChange={handleSliderChange}
                        onClick={handleSliderClick}
                        modalMode={true}
                        maxLeverage={maxLeverage}
                        hideTitle={true}
                        className={styles.modalSlider}
                        minimumValue={leverageFloor}
                        isDragging={isLeverageBeingDragged}
                        setIsDragging={setIsLeverageBeingDragged}
                    />
                </div>

                {/* <div className={styles.maxPositionContainer}>
                    <p>
                        Max position at Current Leverage
                        <Tooltip
                            content='max position at current level'
                            position='right'
                        >
                            <LuCircleHelp size={12} />
                        </Tooltip>
                    </p>
                    <span>100,000 USD</span>
                </div> */}

                {/* Error display */}
                {error && <div className={styles.error}>{error}</div>}

                {/* Action buttons */}
                <div className={styles.buttonContainer}>
                    <SimpleButton
                        onClick={onClose}
                        bg='dark4'
                        disabled={isProcessing}
                    >
                        Cancel
                    </SimpleButton>
                    <SimpleButton
                        onClick={handleConfirm}
                        bg='accent1'
                        disabled={isProcessing || isLoading}
                    >
                        {transactionStatus === 'pending'
                            ? 'Confirming...'
                            : isProcessing
                              ? 'Processing...'
                              : isLoading
                                ? 'Loading...'
                                : 'Confirm'}
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
