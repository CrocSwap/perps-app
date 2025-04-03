import type { DebugWallet } from "~/stores/DebugStore";

export enum FormatTypes {
    EN = 'en-US',
    DE = 'de-DE',
    FR = 'fr-FR',
    SV = 'sv-SE',
}

export type NumFormat = {
    label: string;
    value: FormatTypes;
}

export type LangType = {
    label: string;
}

export type BuySellColor = {
    type: 'normal' | 'inverse';
    buy: string;
    sell: string;
}

export const NumFormatTypes: NumFormat[] = [
    {
        label: '1,234.56',
        value: FormatTypes.EN
    },
    {
        label: '1.234,56',
        value: FormatTypes.DE
    },
    {
        label: '1234,56',
        value: FormatTypes.FR
    },
    {
        label: '1 234,56',
        value: FormatTypes.SV
    }

]


export const Langs: LangType[] = [
    {
        label: 'English',
    },
    {
        label: 'Français',
    },
    {
        label: '한국어',
    },
    {
        label: '简体中文',
    },
    
]



export const wsUrls = [
    'wss://api.hyperliquid.xyz/ws',
    'wss://pulse-api-mock.liquidity.tools/ws',
    'wss://api-ui.hyperliquid.xyz/ws'
]

export const debugWallets: DebugWallet[] = [
    {
        label: 'Crazy Account',
        address: '0xECB63caA47c7c4E77F60f1cE858Cf28dC2B82b00'
    },
    {
        label: 'Crazy 2',
        address: '0x023a3d058020fb76cca98f01b3c48c8938a22355'
    },
    {
        label: 'Benjamin Hyper',
        address: '0x1cFd5AAa6893f7d91e2A0aA073EB7f634e871353'
    },
    
]


export const buySellColors: BuySellColor[] = [
    {
        type: 'normal',
        buy: 'var(--green)',
        sell: 'var(--red)'
    },
    {
        type: 'inverse',
        buy: 'var(--red)',
        sell: 'var(--green)'
    }
]



export const OrderHistoryLimits = {
    MAX: 1000,
    RENDERED: 50
}
