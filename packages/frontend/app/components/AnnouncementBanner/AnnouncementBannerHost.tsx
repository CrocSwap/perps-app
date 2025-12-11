import React, { useState } from 'react';
import { GrClose } from 'react-icons/gr';
import { t } from 'i18next';
import styles from './AnnouncementBanner.module.css';
import { bannerRegistry } from './banners';
import { ACTIVE_ANNOUNCEMENT_BANNER } from '~/utils/Constants';
import { useViewed } from '~/stores/AlreadySeenStore';

export type AnnouncementBannerType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'update'
    | 'fogoPresale';

interface AnnouncementBannerHostProps {
    type?: AnnouncementBannerType;
    dismissible?: boolean;
    className?: string;
    inPageHeader?: boolean;
}

/**
 * Host component that renders the active announcement banner based on
 * the VITE_ACTIVE_ANNOUNCEMENT_BANNER environment variable.
 *
 * The banner key maps to components registered in ./banners/index.ts
 */
const AnnouncementBannerHost: React.FC<AnnouncementBannerHostProps> = ({
    type = 'fogoPresale',
    dismissible = false,
    className = '',
    inPageHeader = false,
}) => {
    const bannerKey = ACTIVE_ANNOUNCEMENT_BANNER;
    const alreadyViewed = useViewed();
    const storageKey = `banner-${bannerKey}`;

    const [isDismissed, setIsDismissed] = useState<boolean>(() => {
        return alreadyViewed.checkIfViewed(storageKey);
    });

    // No active banner configured
    if (!bannerKey || !bannerRegistry[bannerKey]) {
        return null;
    }

    // User has dismissed this banner
    if (isDismissed) {
        return null;
    }

    const BannerComponent = bannerRegistry[bannerKey];

    const handleClose = (): void => {
        setIsDismissed(true);
        alreadyViewed.markAsViewed([storageKey]);
    };

    const getTypeClass = (bannerType: AnnouncementBannerType): string => {
        switch (bannerType) {
            case 'info':
                return styles.info;
            case 'success':
                return styles.success;
            case 'warning':
                return styles.warning;
            case 'error':
                return styles.error;
            case 'update':
                return styles.update;
            case 'fogoPresale':
                return styles.fogo_presale;
            default:
                return styles.info;
        }
    };

    const combinedClassName = [
        styles.announcementBanner,
        getTypeClass(type),
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={`${combinedClassName} ${inPageHeader ? styles.inPageHeader : styles.notInPageHeader}`}
        >
            <div className={styles.content}>
                <BannerComponent />
            </div>
            {dismissible && (
                <button
                    onClick={handleClose}
                    className={styles.closeButton}
                    aria-label={t('aria.closeAnnouncement')}
                    type='button'
                >
                    <GrClose size={16} />
                </button>
            )}
        </div>
    );
};

export default AnnouncementBannerHost;
