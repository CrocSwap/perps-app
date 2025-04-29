import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface accountIF {
    name: string;
    address: string;
    equity: string;
}

class Account implements accountIF {
    name: string;
    address: string;
    equity: string;
    constructor(n: string, a: string, e: string) {
        this.name = n;
        this.address = a;
        this.equity = e;
    }
}

export interface allAccountsIF {
    master: accountIF;
    sub: accountIF[];
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_DOLLARS = '$0.00';

const MOCK_ACCOUNTS: allAccountsIF = {
    master: new Account('Master Account', ZERO_ADDRESS, ZERO_DOLLARS),
    sub: [
        new Account('Sub-Account 1', ZERO_ADDRESS, ZERO_DOLLARS),
        new Account('Sub-Account 5', ZERO_ADDRESS, ZERO_DOLLARS),
        new Account('Sub-Account 2', ZERO_ADDRESS, ZERO_DOLLARS),
        new Account('Sub-Account 3', ZERO_ADDRESS, ZERO_DOLLARS),
        new Account('Sub-Account 4', ZERO_ADDRESS, ZERO_DOLLARS),
    ],
};

export interface useAccountsIF extends allAccountsIF {
    create: (n: string) => void;
    reset: () => void;
}

// string-union type of all keys in the `DEFAULTS` obj
export type accountLevelsT = keyof typeof MOCK_ACCOUNTS;

// key to identify data obj in local storage
const LS_KEY = 'ACCOUNTS';

// hook to manage global state and local storage
export const useAccounts = create<useAccountsIF>()(
    // persist data in local storage (only values, not reducers)
    persist(
        (set, get) => ({
            // consume default data from the `MOC_ACCOUNTS` obj, persisted
            // ... data from local storage will re-hydrate if present
            ...MOCK_ACCOUNTS,
            // add a new sub-account
            create: (name: string): void => set({
                sub: get().sub.concat(new Account(name, ZERO_ADDRESS, ZERO_DOLLARS))
            }),
            // reset to only the default mock data
            reset: (): void => set(MOCK_ACCOUNTS),
        }),
        {
            // key for local storage
            name: LS_KEY,
            // format and destination of data
            storage: createJSONStorage(() => localStorage),
        },
    ),
);