import { create } from 'zustand';

// slugs to indicate which React icon should be rendered
type icons = 'spinner' | 'check' | 'error';

// shape of post-processed data used to construct a DOM element
export interface notificationIF {
    // title text for the card
    title: string;
    // descriptive text body for the card
    message: string;
    // icon to display on the card
    icon: icons;
    // unique ID for the tx used to generate the card, used for
    // ... updating and removing cards
    slug: number;
    // time in ms to wait before removing the notification
    removeAfter?: number;
    // link to explorer
    txLink?: string;
}

// type to allow new notification creation without manual fingerprinting
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

// shape of the return obj produced by this store
export interface NotificationStoreIF {
    notifications: notificationIF[];
    latestTx: notificationIF | null;
    add: (data: notificatioSlugOptionalT) => void;
    remove: (id: number) => void;
    clearAll: () => void;
}

// cap on the number of notifications to manage
const MAX_NOTIFICATIONS = 3;

// the actual data store
export const useNotificationStore = create<NotificationStoreIF>((set, get) => ({
    // raw data consumed by the app
    notifications: [],
    latestTx: null,
    // fn to add a new population to state
    add: (data: notificatioSlugOptionalT): void => {
        const newNotification = data.slug
            ? (data as notificationIF)
            : { ...data, slug: makeSlug(14) };
        set({
            notifications: [...get().notifications, newNotification].slice(
                -MAX_NOTIFICATIONS,
            ),
            // Update latestTx only if this notification has a txLink
            ...(newNotification.txLink && { latestTx: newNotification }),
        });
    },
    // fn to remove an existing element from the data array
    remove: (id: number): void =>
        set({
            notifications: get().notifications.filter(
                (n: notificationIF) => n.slug !== id,
            ),
        }),
    // fn to clear all notifications from state
    clearAll: (): void => set({ notifications: [] }),
}));
