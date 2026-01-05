import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FormStatusState {
    completedWallets: string[];
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    addCompletedWallet: (wallet: string) => void;
    isWalletCompleted: (wallet: string) => boolean;
}

export const useFormStatusStore = create<FormStatusState>()(
    persist(
        (set, get) => ({
            completedWallets: [],
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
            addCompletedWallet: (wallet) =>
                set((state) => ({
                    completedWallets: state.completedWallets.includes(wallet)
                        ? state.completedWallets
                        : [...state.completedWallets, wallet],
                })),
            isWalletCompleted: (wallet) =>
                get().completedWallets.includes(wallet),
        }),
        {
            name: 'affiliate-form-status-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
