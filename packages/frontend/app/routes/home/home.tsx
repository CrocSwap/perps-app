// Optimized Hero Section
import { type CSSProperties, type JSX } from 'react';
import { Link, useNavigation } from 'react-router';
import styles from './home.module.css';

import { motion } from 'framer-motion';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import btcImage from '../../assets/tokens/btc.svg';
import daiImage from '../../assets/tokens/dai.svg';
import ethImage from '../../assets/tokens/eth.svg';
import usdtImage from '../../assets/tokens/usdt.svg';
import Hero from '~/components/Home/Hero/Hero';
import { useTranslation } from 'react-i18next';

interface FloatingTokenProps {
    src: string;
    size?: number;
    top?: string;
    left?: string;
    duration?: number;
    delay?: number;
    direction?: number;
}

function FloatingBgToken({
    src,
    size = 90,
    top = '50%',
    left = '50%',
    duration = 60,
    delay = 0,
    direction = 1,
}: FloatingTokenProps): JSX.Element {
    return (
        <div
            className={styles.floatingToken}
            style={
                {
                    position: 'absolute',
                    top,
                    left,
                    width: size,
                    height: size,
                    opacity: 0.06,
                    zIndex: 4,
                    filter: 'blur(1px)',
                    pointerEvents: 'none',
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    animationDirection: direction === 1 ? 'normal' : 'reverse',
                } as CSSProperties
            }
        >
            <img src={src} alt='token-bg' width={size} height={size} />
        </div>
    );
}

// Token data interface and definition
interface TokenData {
    src: string;
    size: number;
    top: string;
    left: string;
    duration: number;
    delay: number;
    direction: number;
}

const tokenData: TokenData[] = [
    {
        src: btcImage,
        size: 100,
        top: '5%',
        left: '-10%',
        duration: 90,
        delay: 0,
        direction: 1,
    },
    {
        src: ethImage,
        size: 90,
        top: '65%',
        left: '-15%',
        duration: 60,
        delay: 3,
        direction: -1,
    },
    {
        src: usdtImage,
        size: 130,
        top: '85%',
        left: '-10%',
        duration: 60,
        delay: 5,
        direction: 1,
    },
    {
        src: daiImage,
        size: 95,
        top: '30%',
        left: '-12%',
        duration: 60,
        delay: 7,
        direction: -1,
    },
    {
        src: ethImage,
        size: 85,
        top: '20%',
        left: '-5%',
        duration: 60,
        delay: 1.5,
        direction: 1,
    },
];

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
    // const [hasVisited, setHasVisited] = useState(false);

    // useEffect(() => {
    //     try {
    //         const visited = sessionStorage.getItem('hasVisitedHome') === 'true';
    //         setHasVisited(visited);

    //         if (!visited) {
    //             sessionStorage.setItem('hasVisitedHome', 'true');
    //         }
    //     } catch (e) {
    //         console.error('Session storage error:', e);
    //     }
    // }, []);

    const navigation = useNavigation();

    const { t } = useTranslation();

    const { symbol } = useTradeDataStore();

    function TradeButton({ symbol }: { symbol: string }) {
        const isNavigating = navigation.state !== 'idle';

        return (
            <Link
                to={`/v2/trade/${symbol}`}
                className={styles.primary}
                viewTransition
            >
                {isNavigating ? t('common.loading') : t('home.startTrading')}
            </Link>
        );
    }
    const showOnlyHero = true;

    if (showOnlyHero) return <Hero />;

    return (
        <section className={styles.hero}>
            <div className={styles.ambientGlow} />
            <div className={styles.sweepLight} />

            {tokenData.map((token, index) => (
                <FloatingBgToken
                    key={`token-${index}`}
                    src={token.src}
                    size={token.size}
                    top={token.top}
                    left={token.left}
                    duration={token.duration}
                    delay={token.delay}
                    direction={token.direction}
                />
            ))}

            <motion.div
                className={styles.left}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
            >
                <h1>{t('home.title')}</h1>
                <p>{t('home.subtitle')}</p>
                <div className={styles.buttons}>
                    <TradeButton symbol={symbol} />
                    <button className={styles.secondary}>
                        {t('home.learnMore')}
                    </button>
                </div>
            </motion.div>

            <motion.div
                className={styles.right}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
            >
                <div className={styles.mockupGlow} />
                <div className={styles.mockupContainer}>
                    <Link to={`/v2/trade/${symbol}`} viewTransition>
                        <img
                            src='/images/mockup.png'
                            alt='Perps App'
                            className={styles.mockup}
                            width='600'
                            height='400'
                            loading='eager'
                        />
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}
