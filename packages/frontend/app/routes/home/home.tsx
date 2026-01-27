// Optimized Hero Section
import { type JSX } from 'react';
import styles from './home.module.css';

import { useTranslation } from 'react-i18next';
import HomePage from '~/components/Home/HomePage';
import PreventPullToRefresh from '~/components/Home/hooks/PreventPullToRefresh';

export function meta() {
    const { t } = useTranslation();

    const ogImageRectangle = 'https://embindexer.net/ember/on-ambient/BTC';
    const linkUrl = 'https://perps.ambient.finance';

    const ogTitle = 'Ambient Finance | Perpetual Futures on Fogo';
    const ogDescription =
        'Trade perpetual futures on Fogo with Ambient Finance. Zero taker fees, up to 100x leverage, and lightning-fast execution.';
    const seoDescription =
        'Trade perpetual futures on Fogo with Ambient Finance. Zero taker fees, up to 100x leverage, and lightning-fast execution. The premier Solana perps DEX experience.';
    const seoKeywords =
        'Solana perps, perpetual futures, Fogo, Ambient Finance, decentralized exchange, DEX, crypto trading, leverage trading, Solana trading, perps DEX';

    return [
        { title: t('meta.title') },
        { name: 'description', content: seoDescription },
        { name: 'keywords', content: seoKeywords },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: ogTitle },
        { property: 'og:description', content: ogDescription },
        { property: 'og:image', content: ogImageRectangle },
        { property: 'og:url', content: linkUrl },
        { property: 'og:image:alt', content: ogDescription },

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@ambient_finance' },
        { name: 'twitter:creator', content: '@ambient_finance' },
        { name: 'twitter:title', content: ogTitle },
        { name: 'twitter:description', content: ogDescription },
        { name: 'twitter:image', content: ogImageRectangle },
        { name: 'twitter:image:alt', content: ogDescription },
        { name: 'twitter:url', content: linkUrl },
    ];
}

export default function Home(): JSX.Element {
    return (
        <div className={styles.mainContainer}>
            <HomePage />
        </div>
    );
}
