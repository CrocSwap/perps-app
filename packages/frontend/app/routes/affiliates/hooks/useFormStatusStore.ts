import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | null;

interface ApplicationStatusData {
    status: ApplicationStatus;
    email?: string;
    createdAt?: string;
    lifecycleStage?: string;
    leadStatus?: string;
}

interface FormStatusState {
    completedWallets: string[];
    applicationStatus: ApplicationStatusData | null;
    isCheckingStatus: boolean;
    statusError: string | null;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    addCompletedWallet: (wallet: string) => void;
    isWalletCompleted: (wallet: string) => boolean;
    checkApplicationStatus: (
        wallet: string,
    ) => Promise<ApplicationStatusData | null>;
    clearStatus: () => void;
}

export const useFormStatusStore = create<FormStatusState>()(
    persist(
        (set, get) => ({
            completedWallets: [],
            applicationStatus: null,
            isCheckingStatus: false,
            statusError: null,
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
            checkApplicationStatus: async (wallet: string) => {
                if (!wallet) {
                    set({ applicationStatus: null, statusError: null });
                    return null;
                }

                set({ isCheckingStatus: true, statusError: null });

                try {
                    const res = await fetch(
                        `/api/hubspot-status?wallet=${encodeURIComponent(wallet)}`,
                    );
                    const data = await res.json();

                    if (!res.ok) {
                        throw new Error(data.error || 'Failed to check status');
                    }

                    if (!data.found) {
                        set({
                            applicationStatus: null,
                            isCheckingStatus: false,
                        });
                        return null;
                    }

                    const statusData: ApplicationStatusData = {
                        status: data.status,
                        email: data.email,
                        createdAt: data.createdAt,
                        lifecycleStage: data.lifecycleStage,
                        leadStatus: data.leadStatus,
                    };

                    set({
                        applicationStatus: statusData,
                        isCheckingStatus: false,
                    });

                    return statusData;
                } catch (error) {
                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : 'Failed to check application status';
                    set({
                        statusError: errorMessage,
                        isCheckingStatus: false,
                    });
                    return null;
                }
            },
            clearStatus: () =>
                set({ applicationStatus: null, statusError: null }),
        }),
        {
            name: 'affiliate-form-status-storage',
            partialize: (state) => ({
                completedWallets: state.completedWallets,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
