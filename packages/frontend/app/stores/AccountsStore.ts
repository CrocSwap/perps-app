import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateSolanaAddress } from '~/utils/functions/makeAddress';

type subaccountGroupT = 'strategy' | 'discretionary';

export interface accountIF {
    name: string;
    address: string;
    equity: string;
    group: subaccountGroupT;
}

class Account implements accountIF {
    name: string;
    address: string;
    equity: string;
    group: subaccountGroupT;
    constructor(n: string, a: string, e: string, g: subaccountGroupT) {
        this.name = n;
        this.address = a;
        this.equity = e;
        this.group = g;
    }
}

export interface allAccountsIF {
    master: accountIF;
    sub: accountIF[];
}

const ZERO_DOLLARS = '$0.00';

const MOCK_ACCOUNTS: allAccountsIF = {
    master: new Account(
        'Master Account',
        generateSolanaAddress(),
        ZERO_DOLLARS,
        'discretionary',
    ),
    sub: [
        new Account(
            'Sub-Account 1',
            generateSolanaAddress(),
            ZERO_DOLLARS,
            'discretionary',
        ),
        new Account(
            'Sub-Account 2',
            generateSolanaAddress(),
            ZERO_DOLLARS,
            'discretionary',
        ),
        new Account(
            'Sub-Account 5',
            generateSolanaAddress(),
            ZERO_DOLLARS,
            'strategy',
        ),
        new Account(
            'Sub-Account 3',
            generateSolanaAddress(),
            ZERO_DOLLARS,
            'discretionary',
        ),
        new Account(
            'Sub-Account 4',
            generateSolanaAddress(),
            ZERO_DOLLARS,
            'strategy',
        ),
    ],
};

export interface useAccountsIF extends allAccountsIF {
    create: (n: string, g: subaccountGroupT) => void;
    reset: () => void;
}

// string-union type of all keys in the `DEFAULTS` obj
export type accountLevelsT = keyof typeof MOCK_ACCOUNTS;

// key to identify data obj in local storage
const LS_KEY = 'subaccounts';

// hook to manage global state and local storage
export const useAccounts = create<useAccountsIF>()(
    // persist data in local storage (only values, not reducers)
    persist(
        (set, get) => ({
            // consume default data from the `MOC_ACCOUNTS` obj, persisted
            // ... data from local storage will re-hydrate if present
            ...MOCK_ACCOUNTS,
            // add a new sub-account
            create: (name: string, g: subaccountGroupT): void => {
                set({
                    sub: get().sub.concat(
                        new Account(
                            name,
                            generateSolanaAddress(),
                            ZERO_DOLLARS,
                            g,
                        ),
                    ),
                });
            },
            // reset to only the default mock data
            reset: (): void => {
                set(MOCK_ACCOUNTS);
            },
        }),
        {
            // key for local storage
            name: LS_KEY,
            // format and destination of data
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
