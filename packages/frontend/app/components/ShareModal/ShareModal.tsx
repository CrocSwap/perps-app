import { useMemo, useRef, useState, useEffect } from 'react';
import { RiTwitterFill } from 'react-icons/ri';
import { LuCopy, LuInfo, LuShare2, LuCheck } from 'react-icons/lu';
import { tokenIconMap } from '~/assets/tokens/tokenIconMap';
import useNumFormatter from '~/hooks/useNumFormatter';
import useClipboard from '~/hooks/useClipboard';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useNotificationStore } from '~/stores/NotificationStore';
import {
    FOGO_TWITTER,
    PERPS_TWITTER,
    TWITTER_CHARACTER_LIMIT,
} from '~/utils/Constants';
import type { PositionIF } from '~/utils/position/PositionIFs';
import Modal from '../Modal/Modal';
import ShareModalDetails from './ShareModalDetails';
import perpsLogo from './perpsLogo.png';
import btcIcon from '~/assets/tokens/btc.svg';
import styles from './ShareModal.module.css';
import { t } from 'i18next';
import { printDomToImage } from '~/utils/functions/printDomToImage';

type ViewMode = 'share' | 'details';

interface PropsIF {
    close: () => void;
    position: PositionIF;
    initialTab?: ViewMode;
}

export default function ShareModal(props: PropsIF) {
    const { close, position, initialTab = 'share' } = props;

    const [viewMode, setViewMode] = useState<ViewMode>(initialTab);
    const [isCopying, setIsCopying] = useState(false);
    const [showCopied, setShowCopied] = useState(false);

    const memPosition = useMemo(() => position, []);
    const { formatNum } = useNumFormatter();
    const { coinPriceMap } = useTradeDataStore();
    const notifications = useNotificationStore();
    const [_, copy] = useClipboard();

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const cardRef = useRef<HTMLElement>(null);
    const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const coinIcon = useMemo(
        () => tokenIconMap[memPosition.coin.toUpperCase()] || btcIcon,
        [memPosition.coin],
    );

    const referralLink = 'https://perps.ambient.finance';
    const returnOnEquity = memPosition.returnOnEquity;
    const markPrice = coinPriceMap.get(memPosition.coin) ?? 0;

    useEffect(() => {
        return () => {
            if (copiedTimeoutRef.current) {
                clearTimeout(copiedTimeoutRef.current);
            }
        };
    }, []);

    function openShareOnX(text: string, referralLink: string) {
        window.open(
            'https://x.com/intent/tweet?text=' +
                encodeURIComponent(text) +
                ' ' +
                encodeURIComponent(referralLink),
            'tweetWindow',
            'width=550,height=420,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes',
        );
    }

    async function copyAsImage() {
        if (!cardRef.current || isCopying) return;

        setIsCopying(true);

        try {
            const clone = cardRef.current.cloneNode(true) as HTMLElement;

            // add twitter-only styling hook
            clone.classList.add(styles.twitterCapture);

            Object.assign(clone.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '1200px',
                height: '628px',
                // background: '#0d0d14',
                zIndex: '-99999',
            });

            document.body.appendChild(clone);

            // 4. Wait for paint
            await new Promise((r) => requestAnimationFrame(r));
            await new Promise((r) => requestAnimationFrame(r));

            // 5. Capture the CLONE
            const blob = await printDomToImage(clone, '#0d0d14');

            // 6. Cleanup immediately
            document.body.removeChild(clone);

            if (!blob) throw new Error('Failed to generate image');

            const success = await copy(blob);

            if (success) {
                setShowCopied(true);
                if (copiedTimeoutRef.current) {
                    clearTimeout(copiedTimeoutRef.current);
                }
                copiedTimeoutRef.current = setTimeout(
                    () => setShowCopied(false),
                    2000,
                );
            }

            setIsCopying(false);
        } catch (err) {
            console.error(err);

            notifications.add({
                title: t('share.copyFailed') || 'Copy Failed',
                message:
                    t('share.copyFailedMessage') || 'Failed to capture image',
                icon: 'error',
            });

            setIsCopying(false);
        }
    }

    return (
        <Modal title='' close={close} noHeader>
            <div className={styles.container}>
                {/* LIVE CARD (SOURCE OF TRUTH) */}
                <section ref={cardRef} className={styles.leftSide}>
                    <img
                        src={perpsLogo}
                        alt='Perps logo'
                        className={styles.perpsLogo}
                    />

                    <div className={styles.leftContent}>
                        {viewMode === 'details' ? (
                            <ShareModalDetails
                                position={memPosition}
                                coinIcon={coinIcon}
                            />
                        ) : (
                            <div className={styles.marketInfoContainer}>
                                <div className={styles.market}>
                                    <div className={styles.market_tkn}>
                                        <div className={styles.symbol_icon}>
                                            <img
                                                src={coinIcon}
                                                alt={memPosition.coin}
                                            />
                                        </div>
                                        <div className={styles.symbol}>
                                            {memPosition.coin}
                                        </div>
                                        <div
                                            className={styles.yield}
                                            style={{
                                                color: `var(--${
                                                    memPosition.szi > 0
                                                        ? 'green'
                                                        : 'red'
                                                })`,
                                                backgroundColor: `var(--${
                                                    memPosition.szi > 0
                                                        ? 'green'
                                                        : 'red'
                                                }-dark)`,
                                            }}
                                        >
                                            {(memPosition.szi > 0
                                                ? t('tradeTable.long')
                                                : t('tradeTable.short')) +
                                                ' ' +
                                                Math.floor(
                                                    memPosition.leverage.value,
                                                )}
                                            x
                                        </div>
                                    </div>

                                    <div
                                        className={styles.market_pct}
                                        style={{
                                            color: `var(--${
                                                returnOnEquity > 0
                                                    ? 'green'
                                                    : 'red'
                                            })`,
                                        }}
                                    >
                                        {returnOnEquity > 0 && '+'}
                                        {formatNum(returnOnEquity * 100, 1)}%
                                    </div>
                                </div>

                                <div className={styles.prices}>
                                    <div className={styles.price}>
                                        <div className={styles.priceLabel}>
                                            {t('tradeTable.entryPrice')}
                                        </div>
                                        <div className={styles.priceValue}>
                                            {formatNum(memPosition.entryPx)}
                                        </div>
                                    </div>
                                    <div className={styles.price}>
                                        <div className={styles.priceLabel}>
                                            {t('tradeTable.markPrice')}
                                        </div>
                                        <div className={styles.priceValue}>
                                            {formatNum(markPrice)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* RIGHT SIDE */}
                <section className={styles.rightSide}>
                    <div className={styles.view_toggle}>
                        <button
                            className={`${styles.toggle_btn} ${
                                viewMode === 'share' ? styles.active : ''
                            }`}
                            onClick={() => setViewMode('share')}
                        >
                            <LuShare2 size={16} />
                            {t('share.pnl') || 'Share'}
                        </button>

                        <button
                            className={`${styles.toggle_btn} ${
                                viewMode === 'details' ? styles.active : ''
                            }`}
                            onClick={() => setViewMode('details')}
                        >
                            <LuInfo size={16} />
                            {t('share.details') || 'Details'}
                        </button>
                    </div>

                    <div className={styles.custom_text}>
                        <label htmlFor='share_card_custom_text'>
                            {t('share.prompt')}
                        </label>
                        <textarea
                            id='share_card_custom_text'
                            ref={inputRef}
                            maxLength={TWITTER_CHARACTER_LIMIT}
                            defaultValue={t('share.textPlaceholder', {
                                coin: memPosition.coin,
                                twitter: PERPS_TWITTER,
                                fogo: FOGO_TWITTER,
                            })}
                        />
                    </div>

                    <div className={styles.button_bank}>
                        <button
                            className={styles.copyButton}
                            onClick={copyAsImage}
                            disabled={isCopying || showCopied}
                        >
                            {isCopying ? (
                                t('share.copying') || 'Copying...'
                            ) : showCopied ? (
                                <>
                                    {t('share.copied') || 'Copied'} <LuCheck />
                                </>
                            ) : (
                                <>
                                    {t('share.copyImageCTA') || 'Copy Image'}{' '}
                                    <LuCopy />
                                </>
                            )}
                        </button>

                        <button
                            onClick={async () => {
                                if (!inputRef.current) return;
                                await copyAsImage();
                                openShareOnX(
                                    inputRef.current.value,
                                    referralLink,
                                );
                            }}
                            disabled={isCopying}
                        >
                            {t('share.xCTA')} <RiTwitterFill />
                        </button>
                        <p className={styles.shareHint}>
                            {t('share.shareHint') ||
                                'Clicking Share on X also copies the image to your clipboard'}
                        </p>
                    </div>
                </section>
            </div>
        </Modal>
    );
}
