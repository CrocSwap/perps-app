import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateSolanaAddress } from '~/utils/functions/makeAddress';

export interface strategyIF {
    name: string;
    market: string | 'BTC' | 'ETH' | 'SOL';
    distance: string;
    distanceType: string | 'Ticks' | '%';
    side: string | 'Both' | 'Above' | 'Below';
    totalSize: string;
    orderSize: string;
}

export interface strategyDecoratedIF extends strategyIF {
    address: string;
    pnl: string;
    volume: string;
    maxDrawdown: string;
    ordersPlaced: number;
    runtime: number;
}

function decorateStrategy(s: strategyIF): strategyDecoratedIF {
    return ({
        ...s,
        address: generateSolanaAddress(),
        pnl: '$0.00',
        volume: '$0.00',
        maxDrawdown: '0.00%',
        ordersPlaced: 0,
        runtime: 0,
    });
}

// local storage key to persist data
const LS_KEY = 'STRATEGIES';

const MOCK_STRATEGIES: strategyDecoratedIF[] = [
    {
        address: 'Hfdarm6DDC8t141wvqvPVHLE5ZGBfUvB2LjkyZCbwASo',
        name: 'My First Strategy',
        market: 'BTC',
        distance: '2',
        distanceType: 'Ticks',
        side: 'Both',
        totalSize: '$100,000.00',
        orderSize: '$10,000.00',
        pnl: '$0.00',
        volume: '$0.00',
        maxDrawdown: '0.00%',
        ordersPlaced: 0,
        runtime: 0,
    },
];

export const NEW_STRATEGY_DEFAULTS: strategyIF = {
    name: '',
    market: 'BTC',
    distance: '',
    distanceType: 'Ticks',
    side: 'Both',
    totalSize: '',
    orderSize: '',
}

export interface useStrategiesStoreIF {
    data: strategyDecoratedIF[];
    update: (s: strategyIF, addr: string) => void;
    add: (s: strategyIF) => void;
    remove: (addr: string) => void;
    reset: () => void;
}

export const useStrategiesStore = create<useStrategiesStoreIF>()(
    // persist data in local storage (only values, not reducers)
    persist(
        (set, get) => ({
            // consume default data from the `MOCK_STRATEGIES` obj, persisted
            // ... data from local storage will re-hydrate if present
            data: MOCK_STRATEGIES,
            update: (s: strategyIF, addr: string): void => {
                set({ data: get().data.map(
                    (d: strategyDecoratedIF) => {
                        if (d.address === addr) {
                            return ({
                                ...s,
                                address: d.address,
                                pnl: d.pnl,
                                volume: d.volume,
                                maxDrawdown: d.maxDrawdown,
                                ordersPlaced: d.ordersPlaced,
                                runtime: d.runtime,
                            });
                        } else {
                            return d;
                        }
                    }
                )});
            },
            add: (s: strategyIF): void => {
                set({
                    data: [
                        ...get().data,
                        decorateStrategy(s),
                    ],
                });
            },
            remove: (addr: string): void => {
                set({
                    data: get().data.filter(
                        (d: strategyDecoratedIF) => d.address !== addr
                    ),
                })
            },
            reset: (): void => set({ data: MOCK_STRATEGIES }),
        }),
        {
            // key for local storage
            name: LS_KEY,
            // format and destination of data
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ data: state.data }),
        },
    ),
);

// export interface accountIF {
//     name: string;
//     address: string;
//     equity: string;
// }

// class Account implements accountIF {
//     name: string;
//     address: string;
//     equity: string;
//     constructor(n: string, a: string, e: string) {
//         this.name = n;
//         this.address = a;
//         this.equity = e;
//     }
// }
// const BASE58_ALPHABET =
//     '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// function base58Encode(buffer: number[]): string {
//     let intVal = BigInt(0);
//     for (let i = 0; i < buffer.length; i++) {
//         intVal = (intVal << 8n) + BigInt(buffer[i]);
//     }
//     let encoded = '';
//     while (intVal > 0) {
//         const rem = Number(intVal % 58n);
//         intVal = intVal / 58n;
//         encoded = BASE58_ALPHABET[rem] + encoded;
//     }
//     // Add '1' for each leading 0 byte
//     for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
//         encoded = BASE58_ALPHABET[0] + encoded;
//     }
//     return encoded;
// }

// function generatePseudoRandomBytes(length: number): number[] {
//     const bytes: number[] = [];
//     for (let i = 0; i < length; i++) {
//         bytes.push(Math.floor(Math.random() * 256));
//     }
//     return bytes;
// }

// export function generateSolanaAddress(): string {
//     const randomBytes = generatePseudoRandomBytes(32);
//     return base58Encode(randomBytes);
// }

// export interface allAccountsIF {
//     master: accountIF;
//     sub: accountIF[];
// }

// const ZERO_DOLLARS = '$0.00';

// const MOCK_ACCOUNTS: allAccountsIF = {
//     master: new Account(
//         'Master Account',
//         generateSolanaAddress(),
//         ZERO_DOLLARS,
//     ),
//     sub: [
//         new Account('Sub-Account 1', generateSolanaAddress(), ZERO_DOLLARS),
//         new Account('Sub-Account 2', generateSolanaAddress(), ZERO_DOLLARS),
//         new Account('Sub-Account 5', generateSolanaAddress(), ZERO_DOLLARS),
//         new Account('Sub-Account 3', generateSolanaAddress(), ZERO_DOLLARS),
//         new Account('Sub-Account 4', generateSolanaAddress(), ZERO_DOLLARS),
//     ],
// };

// export interface useAccountsIF extends allAccountsIF {
//     create: (n: string) => void;
//     reset: () => void;
// }

// // string-union type of all keys in the `DEFAULTS` obj
// export type accountLevelsT = keyof typeof MOCK_ACCOUNTS;

// // key to identify data obj in local storage
// const LS_KEY = 'subaccounts';

// // hook to manage global state and local storage
// export const useAccounts = create<useAccountsIF>()(
//     // persist data in local storage (only values, not reducers)
//     persist(
//         (set, get) => ({
//             // consume default data from the `MOC_ACCOUNTS` obj, persisted
//             // ... data from local storage will re-hydrate if present
//             ...MOCK_ACCOUNTS,
//             // add a new sub-account
//             create: (name: string): void =>
//                 set({
//                     sub: get().sub.concat(
//                         new Account(
//                             name,
//                             generateSolanaAddress(),
//                             ZERO_DOLLARS,
//                         ),
//                     ),
//                 }),
//             // reset to only the default mock data
//             reset: (): void => set(MOCK_ACCOUNTS),
//         }),
//         {
//             // key for local storage
//             name: LS_KEY,
//             // format and destination of data
//             storage: createJSONStorage(() => localStorage),
//         },
//     ),
// );
