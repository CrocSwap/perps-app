import { create } from 'zustand';

// slugs to indicate which React icon should be rendered
type icons = 'spinner' | 'check';

// shape of data structure from which to generate placeholder
// ... notification content
interface notificationMetaIF {
    title: string;
    messages: string[];
    icon: icons;
}

// structure of all notification types and potential content for
// ... randomized generation
const notificationMeta: { [x: string]: notificationMetaIF } = {
    leverageModeChanged: {
        title: 'Leverage Mode Changed',
        messages: ['Switched to Isolated Margin Mode'],
        icon: 'check',
    },
    subAccountCreated: {
        title: 'Sub Account Created',
        messages: ['Sub Account 1 Created'],
        icon: 'check',
    },
    leverageAmountChanged: {
        title: 'Leverage Amount Changed',
        messages: ['Switched to 100x Leverage'],
        icon: 'check',
    },
    buyPending: {
        title: 'Buy / Long Order Pending',
        messages: ['Buying 0.0001 ETH at $2,300'],
        icon: 'spinner',
    },
    buyConfirmed: {
        title: 'Buy / Long Order Confirmed',
        messages: ['Bought 0.0001 ETH at $2,300'],
        icon: 'check',
    },
    sellPending: {
        title: 'Sell / Short Order Pending',
        messages: ['Selling 0.0001 ETH at $2,300'],
        icon: 'spinner',
    },
    sellConfirmed: {
        title: 'Sell / Short Confirmed',
        messages: ['Sold 0.0001 ETH at $2,300'],
        icon: 'check',
    },
    depositPending: {
        title: 'Deposit Pending',
        messages: ['Deposit 69,000 USDC', 'Deposit 420,000 USDC'],
        icon: 'spinner',
    },
    depositConfirmed: {
        title: 'Deposit Confirmed',
        messages: ['Deposit 69,000 USDC', 'Deposit 420,000 USDC'],
        icon: 'check',
    },
    withdrawPending: {
        title: 'Withdraw Pending',
        messages: ['Withdraw 69,000 USDC', 'Withdraw 420,000 USDC'],
        icon: 'spinner',
    },
    withdrawConfirmed: {
        title: 'Withdraw Confirmed',
        messages: ['Withdraw 69,000 USDC', 'Withdraw 420,000 USDC'],
        icon: 'check',
    },
    sendPending: {
        title: 'Send Pending',
        messages: ['Send 69,000 USDC', 'Send 420,000 USDC'],
        icon: 'spinner',
    },
    sendConfirmed: {
        title: 'Send Confirmed',
        messages: ['Send 69,000 USDC', 'Send 420,000 USDC'],
        icon: 'check',
    },
};

// string union type of all keys in obj `notificationMeta` listing
// ... all defined notification types
export type notificationSlugs = keyof typeof notificationMeta;

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
    oid: number;
}

// fn to make an order ID number (later this will be supplied by the server)
export function makeOID(digits: number): number {
    const min: number = 10 ** (digits - 1);
    const max: number = 10 ** digits - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// fn to produce an obj literal in the correct shape to generate
// ... a DOM notification element
//      called with arg → fn will return an iteration of the notification
//                        ... corresponding to the provided slug
//      no arg → fn will randomly select a notification format to return
function makeNotificationData(slug?: notificationSlugs): notificationIF {
    // fn to select a random element from an array of same-type elements
    function getRandomElement<T>(a: Array<T>): T {
        const randomIndex: number = Math.floor(Math.random() * a.length);
        return a[randomIndex];
    }
    // select a meta notification data structure by the provided slug or
    // ... at random if no slug was provided
    const meta: notificationMetaIF = slug
        ? notificationMeta[slug]
        : getRandomElement(Object.values(notificationMeta));
    // return data in the shape consumed by the DOM
    return {
        title: meta.title,
        message: getRandomElement(meta.messages),
        icon: meta.icon,
        oid: makeOID(14),
    };
}

// shape of the return obj produced by this store
export interface NotificationStoreIF {
    notifications: notificationIF[];
    add: (s?: notificationSlugs) => void;
    addFromWS: (data: notificationIF) => void;
    remove: (id: number) => void;
    clearAll: () => void;
}

// cap on the number of notifications to manage
const MAX_NOTIFICATIONS = 3;

// the actual data store
export const useNotificationStore = create<NotificationStoreIF>((set, get) => ({
    // raw data consumed by the app
    notifications: [],
    // fn to add a new population to state
    add: (s?: notificationSlugs): void =>
        set({
            notifications: [
                ...get().notifications,
                makeNotificationData(s),
            ].slice(-MAX_NOTIFICATIONS),
        }),
    addFromWS: (data: notificationIF): void =>
        set({
            notifications: [...get().notifications, data].slice(
                -MAX_NOTIFICATIONS,
            ),
        }),
    // fn to remove an existing element from the data array
    remove: (id: number): void =>
        set({
            notifications: get().notifications.filter(
                (n: notificationIF) => n.oid !== id,
            ),
        }),
    // fn to clear all notifications from state
    clearAll: (): void => set({ notifications: [] }),
}));
