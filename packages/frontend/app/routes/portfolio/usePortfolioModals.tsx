import { useCallback, useMemo } from 'react';
import Modal from '~/components/Modal/Modal';
import PortfolioDeposit from '~/components/Portfolio/PortfolioDeposit/PortfolioDeposit';
import PortfolioSend from '~/components/Portfolio/PortfolioSend/PortfolioSend';
import PortfolioWithdraw from '~/components/Portfolio/PortfolioWithdraw/PortfolioWithdraw';
import { useModal } from '~/hooks/useModal';
import { usePortfolioManager } from './usePortfolioManager';
import { t } from 'i18next';

export type PortfolioModalType = 'deposit' | 'withdraw' | 'send';

export interface UsePortfolioModalsReturn {
    openDepositModal: () => void;
    openWithdrawModal: () => void;
    openSendModal: () => void;
    closePortfolioModals: () => void;

    isAnyPortfolioModalOpen: boolean;
    activePortfolioModalType: PortfolioModalType | null;
    isPortfolioActionProcessing: boolean;

    PortfolioModalsRenderer: React.ReactNode;
}

export function usePortfolioModals(): UsePortfolioModalsReturn {
    const depositModal = useModal();
    const withdrawModal = useModal();
    const sendModal = useModal();

    const {
        selectedPortfolio,
        isProcessing,
        setIsProcessing,
        processDeposit: originalProcessDeposit,
        processWithdraw: originalProcessWithdraw,
        processSend: originalProcessSend,
        startDepositAutoRefresh,
        stopDepositAutoRefresh,
        startWithdrawAutoRefresh,
        stopWithdrawAutoRefresh,
    } = usePortfolioManager();

    // Determine which modal is currently open
    const getActiveModal = (): PortfolioModalType | null => {
        if (depositModal.isOpen) return 'deposit';
        if (withdrawModal.isOpen) return 'withdraw';
        if (sendModal.isOpen) return 'send';
        return null;
    };

    const closeAllPortfolioModals = () => {
        depositModal.close();
        withdrawModal.close();
        sendModal.close();
        // Stop all auto refresh when closing modals
        stopDepositAutoRefresh();
        stopWithdrawAutoRefresh();
    };

    const processDeposit = useCallback(
        async (amount: number | 'max') => {
            const result = await originalProcessDeposit(amount);
            // Only close modal if transaction was successful and confirmed
            // The modal will handle its own closing based on transaction status
            // Don't auto-close anymore - let the modal control its state
            return result; // Return the result so the modal can handle success/failure
        },
        [originalProcessDeposit],
    );

    const processWithdraw = useCallback(
        async (amount?: number) => {
            const result = await originalProcessWithdraw(amount);
            // Only close modal if transaction was successful and confirmed
            // The modal will handle its own closing based on transaction status
            // Don't auto-close anymore - let the modal control its state
            return result; // Return the result so the modal can handle success/failure
        },
        [originalProcessWithdraw],
    );

    const processSend = useCallback(
        (address: string, amount: number) => {
            originalProcessSend(address, amount);
            setTimeout(() => {
                if (!isProcessing) {
                    closeAllPortfolioModals();
                }
            }, 2100);
        },
        [originalProcessSend, isProcessing],
    );

    const openDepositModal = () => {
        closeAllPortfolioModals();
        setIsProcessing(false);
        depositModal.open();
        // Start auto refresh when opening deposit modal
        startDepositAutoRefresh();
    };

    const openWithdrawModal = () => {
        closeAllPortfolioModals();
        setIsProcessing(false);
        withdrawModal.open();
        // Start auto refresh when opening withdraw modal
        startWithdrawAutoRefresh();
    };

    const openSendModal = () => {
        closeAllPortfolioModals();
        sendModal.open();
    };

    const activePortfolioModalType = getActiveModal();
    const isAnyPortfolioModalOpen = activePortfolioModalType !== null;

    // Memoize portfolio data to prevent unnecessary re-renders
    const depositPortfolioData = useMemo(
        () =>
            selectedPortfolio
                ? {
                      id: selectedPortfolio.id,
                      name: selectedPortfolio.name,
                      availableBalance: selectedPortfolio.balances.wallet,
                      unit: selectedPortfolio.unit,
                  }
                : null,
        [
            selectedPortfolio?.id,
            selectedPortfolio?.name,
            selectedPortfolio?.balances.wallet,
            selectedPortfolio?.unit,
        ],
    );

    const withdrawPortfolioData = useMemo(
        () =>
            selectedPortfolio
                ? {
                      id: selectedPortfolio.id,
                      name: selectedPortfolio.name,
                      availableBalance: selectedPortfolio.balances.contract,
                      unit: selectedPortfolio.unit,
                  }
                : null,
        [
            selectedPortfolio?.id,
            selectedPortfolio?.name,
            selectedPortfolio?.balances.contract,
            selectedPortfolio?.unit,
        ],
    );

    const PortfolioModalsRenderer =
        isAnyPortfolioModalOpen && selectedPortfolio ? (
            <Modal
                close={closeAllPortfolioModals}
                position='center'
                title={
                    activePortfolioModalType === 'deposit'
                        ? t('common.deposit')
                        : activePortfolioModalType === 'withdraw'
                          ? t('common.withdraw')
                          : activePortfolioModalType === 'send'
                            ? t('common.transfer')
                            : ''
                }
            >
                {activePortfolioModalType === 'deposit' &&
                    depositPortfolioData && (
                        <PortfolioDeposit
                            portfolio={depositPortfolioData}
                            onDeposit={processDeposit}
                            onClose={closeAllPortfolioModals}
                            isProcessing={isProcessing}
                        />
                    )}

                {activePortfolioModalType === 'withdraw' &&
                    withdrawPortfolioData && (
                        <PortfolioWithdraw
                            portfolio={withdrawPortfolioData}
                            onWithdraw={processWithdraw}
                            onClose={closeAllPortfolioModals}
                            isProcessing={isProcessing}
                        />
                    )}

                {activePortfolioModalType === 'send' && (
                    <PortfolioSend
                        availableAmount={selectedPortfolio.balances.contract}
                        tokenType={selectedPortfolio.unit}
                        networkFee={
                            selectedPortfolio.unit === 'USD'
                                ? '$0.001'
                                : '0.0001 BTC'
                        }
                        onSend={processSend}
                        onClose={closeAllPortfolioModals}
                        isProcessing={isProcessing}
                        portfolio={{
                            id: selectedPortfolio.id,
                            name: selectedPortfolio.name,
                            availableBalance:
                                selectedPortfolio.balances.contract,
                            unit: selectedPortfolio.unit,
                        }}
                    />
                )}
            </Modal>
        ) : null;

    return {
        openDepositModal,
        openWithdrawModal,
        openSendModal,
        closePortfolioModals: closeAllPortfolioModals,
        isAnyPortfolioModalOpen,
        activePortfolioModalType,
        isPortfolioActionProcessing: isProcessing,
        PortfolioModalsRenderer,
    };
}
