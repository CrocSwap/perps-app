import { useMemo, useRef } from 'react';
import { LuCopy } from 'react-icons/lu';
import { RiArrowDownLine, RiTwitterFill } from 'react-icons/ri';
import { tokenBackgroundMap } from '~/assets/tokens/tokenBackgroundMap';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { PERPS_TWITTER, TWITTER_CHARACTER_LIMIT } from '~/utils/Constants';
import type { PositionIF } from '~/utils/position/PositionIFs';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import perpsLogo from './perpsLogo.png';
import shareCardBackground from './shareCardBackground.png';
import styles from './ShareModal.module.css';

interface propsIF {
    close: () => void;
    position: PositionIF;
}

export default function ShareModal(props: propsIF) {
    const { close, position } = props;

    const memPosition = useMemo<PositionIF>(() => position, []);

    const { formatNum } = useNumFormatter();
    const { coinPriceMap } = useTradeDataStore();

    const REFERRAL_CODE = '0x1';

    const TEXTAREA_ID_FOR_DOM = 'share_card_custom_text';

    const inputRef = useRef<HTMLTextAreaElement>(null);

    const symbolFileName = useMemo<string>(() => {
        const match = position.coin.match(/^k([A-Z]+)$/);
        return match ? match[1] : position.coin;
    }, [position]);

    const bgType =
        tokenBackgroundMap[memPosition.coin.toUpperCase()] || 'light';

    const referralLink = `https://ambient.finance/v2/join/` + REFERRAL_CODE;

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
                                {(memPosition.szi > 0 ? 'Long' : 'Short') +
                                    ' ' +
                                    memPosition.leverage.value}
                                x
                            </div>
                        </div>
                        <div
                            className={styles.market_pct}
                            style={{
                                color: `var(--${memPosition.returnOnEquity > 0 ? 'green' : 'red'})`,
                            }}
                        >
                            {memPosition.returnOnEquity > 0 && '+'}
                            {formatNum(memPosition.returnOnEquity * 100, 1)}%
                        </div>
                    </div>
                    <div className={styles.prices}>
                        <div className={styles.price}>
                            <div>Entry Price</div>
                            <div>{formatNum(memPosition.entryPx)}</div>
                        </div>
                        <div className={styles.price}>
                            <div>Mark Price</div>
                            <div>
                                {formatNum(
                                    coinPriceMap.get(memPosition.coin) ?? 0,
                                )}
                            </div>
                        </div>
                    </div>
                    <div className={styles.price}>
                        <div>Referral code:</div>
                        <div>{referralLink}</div>
                    </div>
                </div>
                <div className={styles.info}>
                    <div className={styles.referral_code}>
                        <div>Referral Code:</div>
                        <div>{REFERRAL_CODE}</div>
                    </div>
                    <div className={styles.custom_text}>
                        <label htmlFor={TEXTAREA_ID_FOR_DOM}>
                            Customize your text
                        </label>
                        <textarea
                            id={TEXTAREA_ID_FOR_DOM}
                            ref={inputRef}
                            maxLength={TWITTER_CHARACTER_LIMIT}
                            autoComplete='false'
                            defaultValue={`Trade $${memPosition.coin} perps on ${PERPS_TWITTER} using my referral code`}
                        />
                    </div>
                    <div className={styles.button_bank}>
                        <Button size='medium'>
                            Save Image <RiArrowDownLine />
                        </Button>
                        <Button size='medium'>
                            Copy Link <LuCopy />
                        </Button>
                        <Button
                            size='medium'
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
                            Share on 𝕏 <RiTwitterFill />
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
