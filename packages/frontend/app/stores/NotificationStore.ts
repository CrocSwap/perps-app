import { create } from 'zustand';

type icons = 'spinner' | 'check' | 'error';

export interface notificationIF {
    title: string;
    message: string;
    icon: icons;
    slug: number;
    removeAfter?: number;
    txLink?: string;
}

type notificatioSlugOptionalT = Omit<notificationIF, 'slug'> & {
    slug?: number;
    removeAfter?: number;
    txLink?: string;
};

// fn to make an skug to ID each notifcation
export function makeSlug(digits: number): number {
    const min: number = 10 ** (digits - 1);
    const max: number = 10 ** digits - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface NotificationStoreIF {
    notifications: notificationIF[];
    add: (data: notificatioSlugOptionalT) => void;
    remove: (id: number) => void;
    clearAll: () => void;
}

// cap on the number of notifications to manage
const MAX_NOTIFICATIONS = 6;
export const useNotificationStore = create<NotificationStoreIF>((set, get) => ({
    notifications: [],
    add: (data: notificatioSlugOptionalT): void =>
        set({
            notifications: [
                ...get().notifications,
                data.slug
                    ? (data as notificationIF)
                    : { ...data, slug: makeSlug(14) },
            ].slice(-MAX_NOTIFICATIONS),
        }),
    remove: (id: number): void =>
        set({
            notifications: get().notifications.filter(
                (n: notificationIF) => n.slug !== id,
            ),
        }),
    clearAll: (): void => set({ notifications: [] }),
}));
