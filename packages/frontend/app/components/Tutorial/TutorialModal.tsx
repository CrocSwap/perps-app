import React from 'react';
import styles from './TutorialModal.module.css';

// Define the steps of the tutorial
export interface TutorialStep {
    id: number;
    title: string;
    content: string;
    position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    totalSteps: number;
}

interface TutorialModalProps {
    isVisible: boolean;
    currentStep: TutorialStep;
    onPrevious: () => void;
    onNext: () => void;
    onClose: () => void;
}

export default function TutorialModal(props: TutorialModalProps) {
    const { isVisible, currentStep, onPrevious, onNext, onClose } = props;

    if (!isVisible) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.header}>
                    <span className={styles.stepIndicator}>
                        {currentStep.id}/{currentStep.totalSteps}
                    </span>
                    <h2 className={styles.title}>{currentStep.title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className={styles.body}>
                    <p>{currentStep.content}</p>
                </div>
                <div className={styles.navigationDots}>
                    {Array.from({ length: currentStep.totalSteps }).map(
                        (_, index) => (
                            <span
                                key={index}
                                className={`${styles.dot} ${
                                    index + 1 === currentStep.id
                                        ? styles.activeDot
                                        : ''
                                }`}
                            />
                        ),
                    )}
                </div>
                <div className={styles.footer}>
                    <button
                        className={styles.navigationButton}
                        onClick={onPrevious}
                        disabled={currentStep.id === 1}
                    >
                        Previous
                    </button>
                    <button
                        className={`${styles.navigationButton} ${styles.primaryButton}`}
                        onClick={onNext}
                    >
                        {currentStep.id === currentStep.totalSteps
                            ? 'Finish'
                            : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}
