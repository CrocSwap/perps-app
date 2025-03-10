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
    'wss://pulse-api-mock.liquidity.tools/ws'
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



