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

    const ogTitle = 'Trade BTC Futures with Ambient on Fogo';
    const ogDescription = 'BTC Perpetual Futures | Trade with Ambient on Fogo';

    return [
        { title: t('meta.title') },
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
