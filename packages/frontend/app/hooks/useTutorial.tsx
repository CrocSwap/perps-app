import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

// Types
interface TutorialContextType {
  showTutorial: boolean;
  hasCompletedTutorial: boolean;
  handleTutorialComplete: () => void;
  handleTutorialSkip: () => void;
  handleRestartTutorial: () => void;
}

// Create context with default values
const TutorialContext = createContext<TutorialContextType>({
  showTutorial: false,
  hasCompletedTutorial: false,
  handleTutorialComplete: () => {},
  handleTutorialSkip: () => {},
  handleRestartTutorial: () => {}
});

export const TutorialProvider: React.FC<{
  tutorialKey?: string;
  children: ReactNode;
}> = ({ 
  tutorialKey = 'ambientFinanceTutorialCompleted',
  children 
}) => {
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean>(false);

  // Initialize from localStorage on client-side
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const tutorialCompleted = localStorage.getItem(tutorialKey);
    if (tutorialCompleted) {
      setHasCompletedTutorial(true);
    } else {
      // Show tutorial automatically for new users
      setShowTutorial(true);
    }
  }, [tutorialKey]);

  // Handler functions
  const handleTutorialComplete = (): void => {
    console.log('Tutorial completed');
    setShowTutorial(false);
    setHasCompletedTutorial(true);
    localStorage.setItem(tutorialKey, 'true');
  };

  const handleTutorialSkip = (): void => {
    console.log('Tutorial skipped');
    setShowTutorial(false);
    setHasCompletedTutorial(true);
    localStorage.setItem(tutorialKey, 'true');
  };

  // Note: handleRestartTutorial is implemented in the hook to enable navigation
  const handleRestartTutorialInternal = (): void => {
    console.log('Restarting tutorial (internal handler)');
    setShowTutorial(true);
  };

  // Debug logging
  useEffect(() => {
    console.log(`Tutorial state changed - showTutorial: ${showTutorial}, hasCompleted: ${hasCompletedTutorial}`);
  }, [showTutorial, hasCompletedTutorial]);

  const value: TutorialContextType = {
    showTutorial,
    hasCompletedTutorial,
    handleTutorialComplete,
    handleTutorialSkip,
    // This is a placeholder - the actual implementation is in the hook
    handleRestartTutorial: handleRestartTutorialInternal
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

// The hook that components will use
export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  const navigate = useNavigate();
  
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }

  // Override the handleRestartTutorial to include navigation
  const handleRestartTutorial = (): void => {
    console.log('Restarting tutorial with navigation to /trade');
    
    // First navigate to the trade page (using the default symbol)
    // We can get the current URL to check if we're already on the trade page
    const currentPath = window.location.pathname;
    const isOnTradePage = currentPath.includes('/trade');
    
    if (!isOnTradePage) {
      // Navigate to the trade page before showing tutorial
      navigate('/trade');
      
      // Give a small delay to ensure navigation completes before showing tutorial
      setTimeout(() => {
        context.handleRestartTutorial();
      }, 100);
    } else {
      // Already on trade page, just show the tutorial
      context.handleRestartTutorial();
    }
  };
  
  return {
    ...context,
    handleRestartTutorial
  };
};