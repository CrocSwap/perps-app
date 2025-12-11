import React, { useState, useEffect } from 'react';
import { GrClose } from 'react-icons/gr';
import { t } from 'i18next';
import styles from './AnnouncementBanner.module.css';

export type AnnouncementBannerType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'update'
    | 'fogoPresale';

export interface AnnouncementBannerProps {
    children: React.ReactNode;
    onClose?: () => void;
    type?: AnnouncementBannerType;
    className?: string;
    isVisible?: boolean;
    dismissible?: boolean;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
    children,
    onClose,
    type = 'info',
    className = '',
    isVisible = true,
    dismissible = true,
}) => {
    const [isBannerVisible, setIsBannerVisible] = useState<boolean>(isVisible);

    useEffect(() => {
        setIsBannerVisible(isVisible);
    }, [isVisible]);

    const handleClose = (): void => {
        setIsBannerVisible(false);
        if (onClose) {
            onClose();
        }
    };

    if (!isBannerVisible) return null;

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
                return styles.fogo;
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
        <div className={combinedClassName}>
            <div className={styles.content}>{children}</div>
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

export default AnnouncementBanner;
