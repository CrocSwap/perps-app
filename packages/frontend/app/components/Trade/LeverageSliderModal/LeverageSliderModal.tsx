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
import { getTxLink } from '~/utils/Constants';
import LeverageSlider from '../OrderInput/LeverageSlider/LeverageSlider';
import styles from './LeverageSliderModal.module.css';
import { t } from 'i18next';

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
        setLeverageFloor(Math.min(newLeverageFloor, 10));
    }, [marginBucket]);

    // const currentMarket = useLeverageStore((state) => state.currentMarket);

    // Update local state if currentLeverage prop changes
    useEffect(() => {
        setValue(currentLeverage);
    }, [currentLeverage]);

    const handleSliderChange = (newValue: number) => {
        // Update the leverage in the store immediately as the slider changes
        setValue(newValue);
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
                    title: t('transactions.leverageUpdated.title'),
                    message: t('transactions.leverageUpdated.message', {
                        leverage: value.toFixed(1),
                    }),
                    icon: 'check',
                    txLink: getTxLink(result.signature),
                });

                // Close modal on success
                onClose();
            } else {
                setTransactionStatus('failed');

                // Show error notification and close modal
                notificationStore.add({
                    title: t('transactions.leverageUpdateFailed.title'),
                    message:
                        result.error ||
                        t('transactions.leverageUpdateFailed.message'),
                    icon: 'error',
                    txLink: result.signature
                        ? getTxLink(result.signature)
                        : undefined,
                });
                onClose();
            }
        } catch (error) {
            setTransactionStatus('failed');
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : t('transactions.leverageUpdateFailed.message');

            // Show error notification
            notificationStore.add({
                title: t('transactions.leverageUpdateFailed.title'),
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
        <Modal title={t('leverage.title')} close={onClose}>
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
                        {t('common.cancel')}
                    </SimpleButton>
                    <SimpleButton
                        onClick={handleConfirm}
                        bg='accent1'
                        disabled={isProcessing || isLoading}
                    >
                        {transactionStatus === 'pending'
                            ? t('common.confirming')
                            : isProcessing
                              ? t('common.processing')
                              : isLoading
                                ? t('common.loading')
                                : t('common.confirm')}
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
