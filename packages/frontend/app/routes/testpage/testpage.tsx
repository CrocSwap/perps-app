import {
    PresaleBannerMedium,
    PresaleBannerNarrow,
    PresaleBannerWide,
} from '~/assets';
import styles from './testpage.module.css';
import { useClickableSVG } from '~/hooks/useClickableSVG';

export default function testpage() {
    // fn shell to run when user triggers a banner clickable
    function handleClick(size: string): void {
        console.log(`clicked ${size} banner`);
    }

    // DOM ids for the three banners on this page
    const BANNER_METADATA = {
        wide: {
            idForDOM: 'fogo-presale-banner-wide-clickable',
            action: () => handleClick('wide'),
        },
        medium: {
            idForDOM: 'fogo-presale-banner-medium-clickable',
            action: () => handleClick('medium'),
        },
        narrow: {
            idForDOM: 'fogo-presale-banner-narrow-clickable',
            action: () => handleClick('narrow'),
        },
    };

    // hook instantiations to manage click handlers in DOM
    const wideBanner = useClickableSVG(
        BANNER_METADATA.wide.idForDOM,
        BANNER_METADATA.wide.action,
    );
    const mediumBanner = useClickableSVG(
        BANNER_METADATA.medium.idForDOM,
        BANNER_METADATA.medium.action,
    );
    const narrowBanner = useClickableSVG(
        BANNER_METADATA.narrow.idForDOM,
        BANNER_METADATA.narrow.action,
    );

    return (
        <div className={styles.testpage}>
            <object
                ref={wideBanner.ref}
                type='image/svg+xml'
                data={PresaleBannerWide}
            />
            <object
                ref={mediumBanner.ref}
                type='image/svg+xml'
                data={PresaleBannerMedium}
            />
            <object
                ref={narrowBanner.ref}
                type='image/svg+xml'
                data={PresaleBannerNarrow}
            />
        </div>
    );
}
