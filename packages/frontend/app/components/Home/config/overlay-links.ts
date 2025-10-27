import xIconUrl from '../icons/X.svg';
import discordIconUrl from '../icons/discord.svg';
import docsIconUrl from '../icons/docs.svg';
import sdkIconUrl from '../icons/sdk.svg';
import privacyIconUrl from '../icons/privacy.svg';
import ambientIconUrl from '../icons/ambient_mark.svg';
import githubIconUrl from '../icons/github.svg';

export interface OverlayLink {
    title: string;
    subtitle: string;
    href: string;
    iconSrc: string;
    iconAlt?: string;
}

export const OVERLAY_LINKS: OverlayLink[] = [
    {
        title: 'X',
        subtitle: 'Follow the latest from Ambient Finance',
        href: 'https://twitter.com/ambient_finance',
        iconSrc: xIconUrl,
    },
    {
        title: 'Discord',
        subtitle: 'Join in the discussion',
        href: 'https://discord.gg/ambient-finance',
        iconSrc: discordIconUrl,
    },
    {
        title: 'Docs',
        subtitle: 'Dive into the details',
        href: 'https://docs.ambient.finance',
        iconSrc: docsIconUrl,
    },
    {
        title: 'SDK',
        subtitle: 'Seamlessly integrate with Ambient Finance',
        href: 'https://github.com/ambientxyz/ambient-ts-sdk',
        iconSrc: sdkIconUrl,
    },
    {
        title: 'Github',
        subtitle: 'View our code',
        href: 'https://github.com/ambientxyz',
        iconSrc: githubIconUrl,
    },
    {
        title: 'Terms of Service',
        subtitle: 'Our rules for using the platform',
        href: 'https://ambient.finance/terms',
        iconSrc: docsIconUrl,
    },
    {
        title: 'Privacy Policy',
        subtitle: 'View our policies around data',
        href: 'https://ambient.finance/privacy',
        iconSrc: privacyIconUrl,
    },
    {
        title: 'Brand Kit',
        subtitle: 'Download our brand kit',
        href: 'https://ambient.finance/brand',
        iconSrc: ambientIconUrl,
    },
];
