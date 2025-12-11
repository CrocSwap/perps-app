import { motion } from 'framer-motion';
import styles from './FogoPresaleBanner.module.css';
import { PresaleBannerWide } from '~/assets';

export default function FogoPresaleBanner() {
    const PRESALE_URL = 'https://presale.fogo.io/';

    return (
        <div className={styles.fogo_header_banner_wrapper}>
            <motion.a
                href={PRESALE_URL}
                target='_blank'
                rel='noopener noreferrer'
                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            >
                <img src={PresaleBannerWide} alt='Fogo Presale Banner' />
            </motion.a>
        </div>
    );
}
