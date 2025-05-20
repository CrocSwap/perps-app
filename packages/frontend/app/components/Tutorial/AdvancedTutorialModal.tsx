// AdvancedTutorialModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import styles from './AdvancedTutorialModal.module.css';

export interface TutorialStep {
    id: number;
    title: string;
    content: string;
    targetElementId?: string; // ID of the element to highlight
    targetDataAttribute?: string; // Alternative data attribute to select target
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    totalSteps: number;
}

interface AdvancedTutorialModalProps {
    isVisible: boolean;
    currentStep: TutorialStep;
    onPrevious: () => void;
    onNext: () => void;
    onClose: () => void;
}

export default function AdvancedTutorialModal(
    props: AdvancedTutorialModalProps,
) {
    const { isVisible, currentStep, onPrevious, onNext, onClose } = props;
    const [modalPosition, setModalPosition] = useState({
        top: 0,
        left: 0,
    });
    const [spotlightPosition, setSpotlightPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
        height: 0,
    });
    const [hasTarget, setHasTarget] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isVisible) return;

        // Find the target element
        let targetElement: Element | null = null;

        if (currentStep.targetElementId) {
            targetElement = document.getElementById(
                currentStep.targetElementId,
            );
        } else if (currentStep.targetDataAttribute) {
            targetElement = document.querySelector(
                `[data-tutorial="${currentStep.targetDataAttribute}"]`,
            );
        }

        if (targetElement) {
            setHasTarget(true);
            const rect = targetElement.getBoundingClientRect();

            // Position the spotlight
            setSpotlightPosition({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
            });

            // Calculate modal position based on step position preference
            const modalRect = modalRef.current?.getBoundingClientRect();
            const modalWidth = modalRect?.width || 400;
            const modalHeight = modalRect?.height || 200;

            let newPosition = { top: 0, left: 0 };

            switch (currentStep.position) {
                case 'top':
                    newPosition = {
                        top: rect.top - modalHeight - 10,
                        left: rect.left + rect.width / 2 - modalWidth / 2,
                    };
                    break;
                case 'bottom':
                    newPosition = {
                        top: rect.bottom + 10,
                        left: rect.left + rect.width / 2 - modalWidth / 2,
                    };
                    break;
                case 'left':
                    newPosition = {
                        top: rect.top + rect.height / 2 - modalHeight / 2,
                        left: rect.left - modalWidth - 10,
                    };
                    break;
                case 'right':
                    newPosition = {
                        top: rect.top + rect.height / 2 - modalHeight / 2,
                        left: rect.right + 10,
                    };
                    break;
                default:
                    // Center the modal if position is not specified or is 'center'
                    newPosition = {
                        top: window.innerHeight / 2 - modalHeight / 2,
                        left: window.innerWidth / 2 - modalWidth / 2,
                    };
            }

            // Make sure the modal stays within viewport
            if (newPosition.top < 0) newPosition.top = 10;
            if (newPosition.left < 0) newPosition.left = 10;
            if (newPosition.top + modalHeight > window.innerHeight) {
                newPosition.top = window.innerHeight - modalHeight - 10;
            }
            if (newPosition.left + modalWidth > window.innerWidth) {
                newPosition.left = window.innerWidth - modalWidth - 10;
            }

            setModalPosition(newPosition);
        } else {
            setHasTarget(false);
            // Center the modal if no target element
            const modalRect = modalRef.current?.getBoundingClientRect();
            const modalWidth = modalRect?.width || 400;
            const modalHeight = modalRect?.height || 200;

            setModalPosition({
                top: window.innerHeight / 2 - modalHeight / 2,
                left: window.innerWidth / 2 - modalWidth / 2,
            });
        }
    }, [isVisible, currentStep]);

    if (!isVisible) return null;

    return (
        <div className={styles.tutorialOverlay}>
            {/* Semi-transparent overlay */}
            <div className={styles.overlay} />

            {/* Spotlight effect if there's a target element */}
            {hasTarget && (
                <div
                    className={styles.spotlight}
                    style={{
                        top: `${spotlightPosition.top}px`,
                        left: `${spotlightPosition.left}px`,
                        width: `${spotlightPosition.width}px`,
                        height: `${spotlightPosition.height}px`,
                    }}
                />
            )}

            {/* Modal content */}
            <div
                ref={modalRef}
                className={styles.modalContent}
                style={{
                    top: `${modalPosition.top}px`,
                    left: `${modalPosition.left}px`,
                }}
            >
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
