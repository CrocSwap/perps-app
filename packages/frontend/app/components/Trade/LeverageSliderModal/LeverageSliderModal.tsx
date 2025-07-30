import React, { useState } from 'react';
import styles from './LeverageSliderModal.module.css';
import Modal from '~/components/Modal/Modal';
import Tooltip from '~/components/Tooltip/Tooltip';
import { BsQuestionCircle } from 'react-icons/bs';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import LeverageSlider from '../OrderInput/LeverageSlider/LeverageSlider';

interface LeverageSliderModalProps {
    currentLeverage: number;
    maxLeverage: number;
    onClose: () => void;
    onConfirm?: (newLeverage: number) => void;
}

export default function LeverageSliderModal({
    currentLeverage,
    maxLeverage,
    onClose,
    onConfirm,
}: LeverageSliderModalProps) {
    const [value, setValue] = useState<number>(currentLeverage);

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm(value);
        }
        onClose();
    };

    return (
        <Modal title='Adjust Leverage' close={onClose}>
            <div className={styles.leverageSliderContainer}>
                {/* Use the enhanced LeverageSlider component in modal mode */}
                <div className={styles.sliderSection}>
                    <LeverageSlider
                        value={value}
                        onChange={setValue}
                        modalMode={true}
                        maxLeverage={maxLeverage}
                        hideTitle={true}
                        className={styles.modalSlider}
                    />
                </div>

                <div className={styles.maxPositionContainer}>
                    <p>
                        Max position at Current Leverage
                        <Tooltip
                            content='max position at current level'
                            position='right'
                        >
                            <BsQuestionCircle size={12} />
                        </Tooltip>
                    </p>
                    <span>100,000 USD</span>
                </div>

                {/* Action buttons */}
                <div className={styles.buttonContainer}>
                    <SimpleButton onClick={onClose} bg='dark4'>
                        Cancel
                    </SimpleButton>
                    <SimpleButton onClick={handleConfirm} bg='accent1'>
                        Confirm
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
