import React, { useState, useEffect } from 'react';
import TutorialModal, { type TutorialStep } from './TutorialModal';

interface TutorialControllerProps {
    isEnabled: boolean;
    onComplete: () => void;
    onSkip: () => void;
}

export default function TutorialController(props: TutorialControllerProps) {
    const { isEnabled, onComplete, onSkip } = props;

    const [isVisible, setIsVisible] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Define the tutorial steps
    const tutorialSteps: TutorialStep[] = [
        {
            id: 1,
            title: 'Welcome',
            content:
                'Welcome to Ambient Finance. This tutorial will guide you through our UI and explain all the features.',
            totalSteps: 8,
        },
        {
            id: 2,
            title: 'Pool Explorer',
            content:
                'This dropdown will allow you to explore tokens available to trade.',
            totalSteps: 8,
        },
        {
            id: 3,
            title: 'Pool Info',
            content: 'Basic pool information can be found here.',
            totalSteps: 8,
        },
        {
            id: 4,
            title: 'Chart Options',
            content: 'These controls will adjust the chart appearance.',
            totalSteps: 8,
        },
        {
            id: 5,
            title: 'Trade Table',
            content:
                'View pool transactions, limit orders, and liquidity positions here.',
            totalSteps: 8,
        },
        {
            id: 6,
            title: 'Transactions',
            content:
                'Filter to show your own transactions, transactions of certain types, or from certain periods.',
            totalSteps: 8,
        },
        {
            id: 7,
            title: 'Wallet',
            content: 'View wallet PnL and holdings.',
            totalSteps: 8,
        },
        {
            id: 8,
            title: 'Managing Transactions',
            content:
                'Manage and view transactions with the buttons to the right.',
            totalSteps: 8,
        },
    ];

    useEffect(() => {
        if (isEnabled) {
            setIsVisible(true);
        }
    }, [isEnabled]);

    const handleNext = () => {
        if (currentStepIndex < tutorialSteps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            setIsVisible(false);
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        onSkip();
    };

    return (
        <TutorialModal
            isVisible={isVisible}
            currentStep={tutorialSteps[currentStepIndex]}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onClose={handleClose}
        />
    );
}
