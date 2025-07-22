import { useCallback } from 'react';
import Modal from '~/components/Modal/Modal';
import PortfolioDeposit from '~/components/Portfolio/PortfolioDeposit/PortfolioDeposit';
import PortfolioWithdraw from '~/components/Portfolio/PortfolioWithdraw/PortfolioWithdraw';
import PortfolioSend from '~/components/Portfolio/PortfolioSend/PortfolioSend';
import { useModal } from '~/hooks/useModal';
import { usePortfolioManager } from './usePortfolioManager';

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
    const depositModal = useModal('closed');
    const withdrawModal = useModal('closed');
    const sendModal = useModal('closed');

    const {
        selectedPortfolio,
        isProcessing,
        processDeposit: originalProcessDeposit,
        processWithdraw: originalProcessWithdraw,
        processSend: originalProcessSend,
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
    };

    const processDeposit = useCallback(
        async (amount: number) => {
            const result = await originalProcessDeposit(amount);
            // Only close modal if transaction was successful and confirmed
            // The modal will handle its own closing based on transaction status
            // Don't auto-close anymore - let the modal control its state
        },
        [originalProcessDeposit],
    );

    const processWithdraw = useCallback(
        (amount: number) => {
            originalProcessWithdraw(amount);
            setTimeout(() => {
                if (!isProcessing) {
                    closeAllPortfolioModals();
                }
            }, 2100);
        },
        [originalProcessWithdraw, isProcessing],
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
        depositModal.open();
    };

    const openWithdrawModal = () => {
        closeAllPortfolioModals();
        withdrawModal.open();
    };

    const openSendModal = () => {
        closeAllPortfolioModals();
        sendModal.open();
    };

    const activePortfolioModalType = getActiveModal();
    const isAnyPortfolioModalOpen = activePortfolioModalType !== null;

    const PortfolioModalsRenderer =
        isAnyPortfolioModalOpen && selectedPortfolio ? (
            <Modal
                close={closeAllPortfolioModals}
                position='center'
                title={
                    activePortfolioModalType === 'deposit'
                        ? 'Deposit'
                        : activePortfolioModalType === 'withdraw'
                          ? 'Withdraw'
                          : activePortfolioModalType === 'send'
                            ? 'Send'
                            : ''
                }
            >
                {activePortfolioModalType === 'deposit' && (
                    <PortfolioDeposit
                        portfolio={{
                            id: selectedPortfolio.id,
                            name: selectedPortfolio.name,
                            availableBalance: selectedPortfolio.balances.wallet,
                            unit: selectedPortfolio.unit,
                        }}
                        onDeposit={processDeposit}
                        onClose={closeAllPortfolioModals}
                        isProcessing={isProcessing}
                    />
                )}

                {activePortfolioModalType === 'withdraw' && (
                    <PortfolioWithdraw
                        portfolio={{
                            id: selectedPortfolio.id,
                            name: selectedPortfolio.name,
                            availableBalance:
                                selectedPortfolio.balances.contract,
                            unit: selectedPortfolio.unit,
                        }}
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
