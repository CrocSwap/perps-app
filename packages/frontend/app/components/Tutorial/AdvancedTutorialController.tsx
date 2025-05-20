import React, { useState, useEffect } from 'react';
import AdvancedTutorialModal, {
    type TutorialStep,
} from './AdvancedTutorialModal';

interface AdvancedTutorialControllerProps {
    isEnabled: boolean;
    onComplete: () => void;
    onSkip: () => void;
}

export default function AdvancedTutorialController(
    props: AdvancedTutorialControllerProps,
) {
    const { isEnabled, onComplete, onSkip } = props;
    const [isVisible, setIsVisible] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Define the tutorial steps with target elements
    const tutorialSteps: TutorialStep[] = [
        {
            id: 1,
            title: 'Welcome',
            content:
                'Welcome to Ambient Finance. This tutorial will guide you through our UI and explain all the features.',
            position: 'center',
            totalSteps: 8,
        },
        {
            id: 2,
            title: 'Pool Explorer',
            content:
                'This dropdown will allow you to explore tokens available to trade.',
            targetElementId: 'tutorial-pool-explorer', // Add IDs to your elements in the app
            // Alternative: targetDataAttribute: 'pool-explorer',
            position: 'bottom',
            totalSteps: 8,
        },
        {
            id: 3,
            title: 'Pool Info',
            content: 'Basic pool information can be found here.',
            targetElementId: 'tutorial-pool-info',
            position: 'bottom',
            totalSteps: 8,
        },
        // {
        //   id: 4,
        //   title: 'Chart Options',
        //   content: 'These controls will adjust the chart appearance.',
        //   targetElementId: 'chart-options',
        //   position: 'bottom',
        //   totalSteps: 8,
        // },
        {
            id: 5,
            title: 'Trade Table',
            content:
                'View pool transactions, limit orders, and liquidity positions here.',
            targetElementId: 'tutorial-trade-table',
            position: 'top',
            totalSteps: 8,
        },
        {
            id: 6,
            title: 'Order Type',
            content:
                'Choose your order type here. Swap: a standard market swap Limit: perform a swap at a specific price, and receive trading fees instead of paying them Pool: provide liquidity to earn rewards',
            targetElementId: 'tutorial-order-type',
            position: 'left',
            totalSteps: 8,
        },
        {
            id: 7,
            title: 'Order Input',
            content:
                'Input the details of your order here including amounts to swap or provide, limit prices, and manage your slippage and trade settings.',
            targetElementId: 'tradeModulesSection',
            position: 'left',
            totalSteps: 8,
        },
        // {
        //   id: 8,
        //   title: 'Managing Transactions',
        //   content: 'Manage and view transactions with the buttons to the right.',
        //   targetElementId: 'transaction-buttons',
        //   position: 'left',
        //   totalSteps: 8,
        // },
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
        <AdvancedTutorialModal
            isVisible={isVisible}
            currentStep={tutorialSteps[currentStepIndex]}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onClose={handleClose}
        />
    );
}
