import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
const BASE58_ALPHABET =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(buffer: number[]): string {
    let intVal = BigInt(0);
    for (let i = 0; i < buffer.length; i++) {
        intVal = (intVal << 8n) + BigInt(buffer[i]);
    }
    let encoded = '';
    while (intVal > 0) {
        const rem = Number(intVal % 58n);
        intVal = intVal / 58n;
        encoded = BASE58_ALPHABET[rem] + encoded;
    }
    // Add '1' for each leading 0 byte
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
        encoded = BASE58_ALPHABET[0] + encoded;
    }
    return encoded;
}

function generatePseudoRandomBytes(length: number): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < length; i++) {
        bytes.push(Math.floor(Math.random() * 256));
    }
    return bytes;
}

export function generateSolanaAddress(): string {
    const randomBytes = generatePseudoRandomBytes(32);
    return base58Encode(randomBytes);
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
    ),
    sub: [
        new Account('Sub-Account 1', generateSolanaAddress(), ZERO_DOLLARS),
        new Account('Sub-Account 2', generateSolanaAddress(), ZERO_DOLLARS),
        new Account('Sub-Account 5', generateSolanaAddress(), ZERO_DOLLARS),
        new Account('Sub-Account 3', generateSolanaAddress(), ZERO_DOLLARS),
        new Account('Sub-Account 4', generateSolanaAddress(), ZERO_DOLLARS),
    ],
};

export interface useAccountsIF extends allAccountsIF {
    create: (n: string) => void;
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
            create: (name: string): void =>
                set({
                    sub: get().sub.concat(
                        new Account(
                            name,
                            generateSolanaAddress(),
                            ZERO_DOLLARS,
                        ),
                    ),
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
