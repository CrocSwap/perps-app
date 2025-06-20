import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VaultDetailsIF } from '~/utils/VaultIFs';

interface VaultData {
    id: string;
    name: string;
    icon: string;
    description: string;
    apr: number;
    totalDeposited: number;
    totalCapacity: number;
    yourDeposit: number;
    hasWithdraw?: boolean;
    unit?: string;
}

type ModalContent = 'withdraw' | 'deposit' | null;

export function useVaultManager() {
    // Vault data state
    const [vaults, setVaults] = useState<VaultData[]>([
        {
            id: 'majors',
            name: 'Majors vault',
            icon: 'majors-icon',
            description: 'BTC, ETH, SOL, FOGO',
            apr: 23.5,
            totalDeposited: 1654890.72,
            totalCapacity: 10000000,
            yourDeposit: 165723,
            hasWithdraw: true,
            unit: 'USD',
        },
        {
            id: 'frontier',
            name: 'Frontier vault',
            icon: 'frontier-icon',
            description: 'Long-tail assets',
            apr: 34.9,
            totalDeposited: 654890.72,
            totalCapacity: 5000000,
            yourDeposit: 0,
            unit: 'USD',
        },
        {
            id: 'btc',
            name: 'BTC vault',
            icon: 'btc-icon',
            description: 'Bitcoin denominated majors',
            apr: 34.9,
            totalDeposited: 5125.96,
            totalCapacity: 10500,
            yourDeposit: 0,
            unit: 'BTC',
        },
    ]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<ModalContent>(null);
    const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);

    // Utility functions
    const formatCurrency = useCallback(
        (value: number, unit: string = 'USD') => {
            if (unit === 'USD') {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }).format(value);
            } else {
                return (
                    new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: unit === 'BTC' ? 6 : 2,
                    }).format(value) +
                    ' ' +
                    unit
                );
            }
        },
        [],
    );

    const formatAPR = useCallback((apr: number) => {
        return `${apr}%`;
    }, []);

    const validateAmount = useCallback(
        (amount: string | number, maxAmount: number) => {
            const numAmount =
                typeof amount === 'string' ? parseFloat(amount) : amount;

            if (isNaN(numAmount) || numAmount <= 0) {
                return {
                    isValid: false,
                    message: 'Please enter a valid amount',
                };
            }

            if (numAmount > maxAmount) {
                return {
                    isValid: false,
                    message: `Amount exceeds maximum of ${formatCurrency(maxAmount)}`,
                };
            }

            return { isValid: true, message: null };
        },
        [formatCurrency],
    );

    const isValidNumberInput = useCallback((value: string) => {
        return /^\d*\.?\d*$/.test(value) && value.length <= 12;
    }, []);

    // Get the selected vault
    const selectedVault = useMemo(
        () =>
            selectedVaultId
                ? vaults.find((v) => v.id === selectedVaultId) || null
                : null,
        [vaults, selectedVaultId],
    );

    // Modal management
    const openModal = useCallback(
        (content: 'withdraw' | 'deposit', vaultId: string) => {
            setSelectedVaultId(vaultId);
            setModalContent(content);
            setModalOpen(true);
        },
        [],
    );
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        // Clear content after animation completes
        timeoutRef.current = setTimeout(() => {
            setModalContent(null);
            setSelectedVaultId(null);
        }, 300);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    // Vault operations
    const handleDeposit = useCallback((vaultId: string, amount: number) => {
        setVaults((prevVaults) =>
            prevVaults.map((vault) =>
                vault.id === vaultId
                    ? {
                          ...vault,
                          yourDeposit: vault.yourDeposit + amount,
                          totalDeposited: vault.totalDeposited + amount,
                      }
                    : vault,
            ),
        );

        return true;
    }, []);

    const handleWithdraw = useCallback((vaultId: string, amount: number) => {
        setVaults((prevVaults) =>
            prevVaults.map((vault) =>
                vault.id === vaultId
                    ? {
                          ...vault,
                          yourDeposit: vault.yourDeposit - amount,
                          totalDeposited: vault.totalDeposited - amount,
                      }
                    : vault,
            ),
        );

        return true;
    }, []);

    const depositToVault = useCallback(
        (vaultId: string) => {
            openModal('deposit', vaultId);
        },
        [openModal],
    );

    const withdrawFromVault = useCallback(
        (vaultId: string) => {
            openModal('withdraw', vaultId);
        },
        [openModal],
    );

    const processDeposit = useCallback(
        (amount: number) => {
            if (!selectedVaultId) return;

            const success = handleDeposit(selectedVaultId, amount);
            if (success) {
                closeModal();
            }
        },
        [selectedVaultId, handleDeposit, closeModal],
    );

    const processWithdraw = useCallback(
        (amount: number) => {
            if (!selectedVaultId) return;

            const success = handleWithdraw(selectedVaultId, amount);
            if (success) {
                closeModal();
            }
        },
        [selectedVaultId, handleWithdraw, closeModal],
    );

    // Calculate available capacity for deposit/withdraw
    const getAvailableCapacity = useCallback(
        (vaultId: string) => {
            const vault = vaults.find((v) => v.id === vaultId);
            if (!vault) return 0;
            return Math.max(0, vault.totalCapacity - vault.totalDeposited);
        },
        [vaults],
    );

    const assignSelectedVault = useCallback((vaultDetails: VaultDetailsIF) => {
        if (!vaults.some((v) => v.id === vaultDetails.vaultAddress)) {
            const vault = {
                id: vaultDetails.vaultAddress,
                name: vaultDetails.name,
                icon: vaults[0].icon,
                description: vaultDetails.description,
                apr: vaultDetails.apr,
                totalDeposited: vaultDetails.tvl,
                totalCapacity: vaultDetails.tvl,
                yourDeposit: 0,
            } as VaultData;
            setVaults((prev) => [...prev, vault]);
        }
        setSelectedVaultId(vaultDetails.vaultAddress);
    }, []);

    return {
        // Data
        vaults,
        selectedVault,
        assignSelectedVault,

        // Modal state
        modalOpen,
        modalContent,

        // Utility functions
        formatCurrency,
        formatAPR,
        validateAmount,
        isValidNumberInput,
        getAvailableCapacity,

        // Actions
        depositToVault,
        withdrawFromVault,
        processDeposit,
        processWithdraw,
        closeModal,
    };
}
