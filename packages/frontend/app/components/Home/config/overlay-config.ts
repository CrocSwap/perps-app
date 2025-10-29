import type { PresetId } from '../types';

interface BaseSlideConfig {
    id: PresetId;
    type: 'hero' | 'feature' | 'links';
    title?: string;
    subtitle?: string;
    accent?: string;
}

export interface HeroSlideConfig extends BaseSlideConfig {
    type: 'hero';
    title: string;
    ctaPrimary: { labelKey: string; href: string };
    ctaSecondary: { label: string; action: 'scrollTo'; target: PresetId };
    footer?: 'ticker';
}

export interface FeatureSlideConfig extends BaseSlideConfig {
    type: 'feature';
    title: string;
    listItems: string[];
}

export interface LinksSlideConfig extends BaseSlideConfig {
    type: 'links';
}

export type SlideConfig =
    | HeroSlideConfig
    | FeatureSlideConfig
    | LinksSlideConfig;

export const OVERLAY_SLIDE_CONFIG: SlideConfig[] = [
    {
        id: 'hero',
        type: 'hero',
        title: 'Perpetually',
        accent: 'Ambitious',
        subtitle: 'The fastest onchain trading experience has arrived',
        ctaPrimary: { labelKey: 'home.startTrading', href: '#' },
        ctaSecondary: { label: 'Explore', action: 'scrollTo', target: 'speed' },
        footer: 'ticker',
    },
    {
        id: 'speed',
        type: 'feature',
        title: 'Trade at',
        accent: 'lightning speed',
        subtitle:
            "Leveraging Fogo's lightning fast co-located validators Ambient perps follows the sun",
        listItems: [
            '> 100k TPS',
            '> 40ms Blocks',
            '> Real-time prices via Pyth',
        ],
    },
    {
        id: 'fees',
        type: 'feature',
        title: 'Zero fees,',
        accent: 'forever',
        subtitle: 'Never pay gas or trading fees again',
        listItems: [
            '> 0% maker and taker fees',
            '> Gasless transactions',
            '> Some other thing about fees',
        ],
    },
    {
        id: 'mev',
        type: 'feature',
        title: 'MEV resistant trades offering',
        accent: 'price improvement',
        subtitle:
            'Dual Flow Batch Auctions prevent stale quotes and offer price improvement',
        listItems: [
            '> idk what to say here',
            '> some stuff about mev protection',
            '> some more stuff about price improvement',
        ],
    },
    {
        id: 'vault',
        type: 'feature',
        title: 'Vaults run by',
        accent: '...',
        subtitle:
            'Ambient ALP vaults target the safest, highest APY on your assets.',
        listItems: [
            '> idk what to say here either',
            '> vault thingys',
            '> high apys or something',
        ],
    },
    {
        id: 'links',
        type: 'links',
    },
];
