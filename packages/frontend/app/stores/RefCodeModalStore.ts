import { create } from 'zustand';

interface RefCodeModalStoreIF {
    shouldOpenModal: boolean;
    codeToConfirm: string;
    openModal: (code: string) => void;
    closeModal: () => void;
}

export const useRefCodeModalStore = create<RefCodeModalStoreIF>((set) => ({
    shouldOpenModal: false,
    codeToConfirm: '',
    openModal: (code: string) =>
        set({ shouldOpenModal: true, codeToConfirm: code }),
    closeModal: () => set({ shouldOpenModal: false, codeToConfirm: '' }),
}));
