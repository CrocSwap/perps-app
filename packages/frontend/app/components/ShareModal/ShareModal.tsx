import { useMemo, useRef } from 'react';
import { RiTwitterFill } from 'react-icons/ri';
import { tokenBackgroundMap } from '~/assets/tokens/tokenBackgroundMap';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import {
    FOGO_TWITTER,
    PERPS_TWITTER,
    TWITTER_CHARACTER_LIMIT,
} from '~/utils/Constants';
import type { PositionIF } from '~/utils/position/PositionIFs';
import Modal from '../Modal/Modal';
import perpsLogo from './perpsLogo.png';
import shareCardBackground from './shareCardBackground.png';
import styles from './ShareModal.module.css';
import { t } from 'i18next';

interface propsIF {
    close: () => void;
    position: PositionIF;
}

export default function ShareModal(props: propsIF) {
    const { close, position } = props;

    const memPosition = useMemo<PositionIF>(() => position, []);

    const { formatNum } = useNumFormatter();
    const { coinPriceMap } = useTradeDataStore();

    // const REFERRAL_CODE = '0x1';

    const TEXTAREA_ID_FOR_DOM = 'share_card_custom_text';

    const inputRef = useRef<HTMLTextAreaElement>(null);

    const symbolFileName = useMemo<string>(() => {
        const match = position.coin.match(/^k([A-Z]+)$/);
        return match ? match[1] : position.coin;
    }, [position]);

    const bgType =
        tokenBackgroundMap[memPosition.coin.toUpperCase()] || 'light';

    const referralLink = 'https://perps.ambient.finance';
    // const referralLink = `https://perps.ambient.finance/v2/join/` + REFERRAL_CODE;

    const returnOnEquity = useMemo(() => {
        return memPosition.returnOnEquity;
    }, [memPosition]);

    return (
        <Modal title='' close={close}>
            <div className={styles.share_modal}>
                <div
                    className={styles.picture_overlay}
                    style={{
                        backgroundImage: `url(${shareCardBackground})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <img
                        src={perpsLogo}
                        alt='Description of the image'
                        style={{
                            width: '240px',
                            height: 'auto',
                            maxHeight: '300px',
                            objectFit: 'cover',
                        }}
                    />
                    <div className={styles.market}>
                        <div className={styles.market_tkn}>
                            <div
                                className={styles.symbol_icon}
                                style={{
                                    background: `var(--${bgType === 'light' ? 'text1' : 'bg-dark1'})`,
                                }}
                            >
                                <img
                                    src={`https://app.hyperliquid.xyz/coins/${symbolFileName}.svg`}
                                    alt={symbolFileName}
                                />
                            </div>
                            <div className={styles.symbol}>
                                {memPosition.coin}
                            </div>
                            <div
                                className={styles.yield}
                                style={{
                                    color: `var(--${memPosition.szi > 0 ? 'green' : 'red'})`,
                                    backgroundColor: `var(--${memPosition.szi > 0 ? 'green' : 'red'}-dark)`,
                                }}
                            >
                                {(memPosition.szi > 0
                                    ? t('tradeTable.long')
                                    : t('tradeTable.short')) +
                                    ' ' +
                                    Math.floor(memPosition.leverage.value)}
                                x
                            </div>
                        </div>
                        <div
                            className={styles.market_pct}
                            style={{
                                color: `var(--${returnOnEquity > 0 ? 'green' : 'red'})`,
                            }}
                        >
                            {returnOnEquity > 0 && '+'}
                            {formatNum(returnOnEquity * 100, 1)}%
                        </div>
                    </div>
                    <div className={styles.prices}>
                        <div className={styles.price}>
                            <div>{t('tradeTable.entryPrice')}</div>
                            <div>{formatNum(memPosition.entryPx)}</div>
                        </div>
                        <div className={styles.price}>
                            <div>{t('tradeTable.markPrice')}</div>
                            <div>
                                {formatNum(
                                    coinPriceMap.get(memPosition.coin) ?? 0,
                                )}
                            </div>
                        </div>
                    </div>
                    {/* <div className={styles.price}>
                        <div>Referral code:</div>
                        <div>{referralLink}</div>
                    </div> */}
                </div>
                <div className={styles.info}>
                    {/* <div className={styles.referral_code}>
                        <div>Referral Code:</div>
                        <div>{REFERRAL_CODE}</div>
                    </div> */}
                    <div className={styles.custom_text}>
                        <label htmlFor={TEXTAREA_ID_FOR_DOM}>
                            {t('share.prompt')}
                        </label>
                        <textarea
                            id={TEXTAREA_ID_FOR_DOM}
                            ref={inputRef}
                            maxLength={TWITTER_CHARACTER_LIMIT}
                            autoComplete='false'
                            defaultValue={t('share.textPlaceholder', {
                                coin: memPosition.coin,
                                twitter: PERPS_TWITTER,
                                fogo: FOGO_TWITTER,
                            })}
                        />
                    </div>
                    <div className={styles.button_bank}>
                        {/* <button>
                            Save Image <RiArrowDownLine />
                        </button>
                        <button>
                            Copy Link <LuCopy />
                        </button> */}
                        <button
                            onClick={() => {
                                const width = 550;
                                const height = 420;
                                const left =
                                    window.screenX +
                                    (window.outerWidth - width) / 2;
                                const top =
                                    window.screenY +
                                    (window.outerHeight - height) / 2;
                                if (inputRef.current)
                                    window.open(
                                        'https://x.com/intent/tweet?text=' +
                                            encodeURIComponent(
                                                inputRef.current.value,
                                            ) +
                                            ' ' +
                                            encodeURIComponent(referralLink),
                                        'tweetWindow',
                                        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes`,
                                    );
                            }}
                        >
                            {t('share.xCTA')} <RiTwitterFill />
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
