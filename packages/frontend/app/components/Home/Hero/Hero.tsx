import DebugLimitCloseModal from '~/routes/testpage/DebugLimitCloseModal';
import TradeButton from '../TradeButton/TradeButton';
import AnimatedPath from './AnimatedPath';
import styles from './Hero.module.css';
import { t } from 'i18next';

export default function Hero() {
    return (
        <div className={styles.hero_container}>
            <div className={styles.animated_background}>
                <AnimatedPath
                    className={styles.animated_path_primary}
                    color1='#1E1E24'
                    color2='#7371FC'
                    color3='#CDC1FF'
                    beamLength={8}
                    skew={0.8}
                    strokeWidth='2'
                />
                {/* Secondary animation layer with different timing */}
                {/* <AnimatedPath
                    className={styles.animated_path_secondary}
                    color1='#2A2A35'
                    color2='#5B59E8'
                    color3='#A099FF'
                    beamLength={6}
                    skew={0.9}
                    strokeWidth='1.5'
                /> */}
                {/* Tertiary animation layer for extra depth */}
                {/* <AnimatedPath
                    className={styles.animated_path_tertiary}
                    color1='#0F0F13'
                    color2='#4543D9'
                    color3='#8B84F0'
                    beamLength={10}
                    skew={0.7}
                    strokeWidth='1'
                /> */}
            </div>

            {/* Mobile-only floating elements */}
            <div className={styles.floating_elements}>
                <div className={styles.floating_circle}></div>
                <div className={styles.floating_circle}></div>
                <div className={styles.floating_circle}></div>
            </div>

            <div className={styles.hero_heading}>
                <h2>
                    {t('home.hero.heading1')}
                    <span>{t('home.hero.one')}</span>
                </h2>
                <h2>{t('home.hero.heading2')}</h2>
            </div>

            <p>{t('home.hero.description')}</p>

            <div className={styles.desktop_trade_button}>
                <TradeButton />
            </div>

            {/* Desktop stats */}
            {/* <div className={styles.hero_stats_container}>
                <div className={styles.hero_stats}>
                    <h2>$2.4B</h2>
                    <p>{t('home.hero.stats.totalVolume')}</p>
                </div>
                <div className={styles.hero_stats}>
                    <h2>50K+</h2>
                    <p>{t('home.hero.stats.activeUsers')}</p>
                </div>
            </div> */}

            {/* Mobile hero content wrapper - only visible on mobile */}
            <div className={styles.mobile_hero_content}>
                {/* Top section */}
                <div className={styles.mobile_hero_top}>
                    {/* Animated icon/logo placeholder */}
                    <div className={styles.hero_icon}>
                        <img
                            src='/images/favicon.svg'
                            alt='Perps Logo'
                            width='70px'
                            height='70px'
                            loading='eager'
                        />
                    </div>

                    {/* Mobile Hero Content */}
                    <div className={styles.mobile_hero_heading}>
                        <h2>
                            {t('home.hero.heading1')}
                            <span>{t('home.hero.one')}</span>
                        </h2>
                        <h2>{t('home.hero.heading2')}</h2>
                    </div>

                    <p>{t('home.hero.description')}</p>
                </div>

                {/* Bottom section */}
                <div className={styles.mobile_hero_bottom}>
                    <TradeButton />

                    {/* Mobile stats cards */}
                    {/* <div className={styles.mobile_hero_stats_container}>
                        <div className={styles.mobile_hero_stats}>
                            <h3>$2.4B</h3>
                            <p>Total Volume</p>
                        </div>
                        <div className={styles.mobile_hero_stats}>
                            <h3>50K+</h3>
                            <p>Active Users</p>
                        </div>
                    </div> */}
                </div>
            </div>
            {/* <DebugLimitCloseModal /> */}
        </div>
    );
}
