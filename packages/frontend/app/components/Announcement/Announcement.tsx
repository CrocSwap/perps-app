import React, { useState, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Announcement.module.css';
import { GrClose } from 'react-icons/gr';
import { t } from 'i18next';

export type AnnouncementPosition =
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | 'bottom-full';

export type AnnouncementType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'update'
    | 'fogoPresale';

export interface AnnouncementProps extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'children'
> {
    children: ReactNode;
    onClose?: () => void;
    position?: AnnouncementPosition;
    type?: AnnouncementType;
    className?: string;
}

const Announcement: React.FC<AnnouncementProps> = ({
    children,
    onClose,
    position = 'bottom-right',
    type = 'info',
    className = '',
    ...props
}) => {
    const [isVisible, setIsVisible] = useState<boolean>(true);

    const handleClose = (): void => {
        setIsVisible(false);
        if (onClose) {
            onClose();
        }
    };

    if (!isVisible) return null;

    const getPositionClass = (pos: AnnouncementPosition): string => {
        switch (pos) {
            case 'bottom-right':
                return styles.bottomRight;
            case 'bottom-left':
                return styles.bottomLeft;
            case 'top-right':
                return styles.topRight;
            case 'top-left':
                return styles.topLeft;
            case 'bottom-full':
                return styles.bottomFull;
            default:
                return styles.bottomRight;
        }
    };

    const getTypeClass = (announcementType: AnnouncementType): string => {
        switch (announcementType) {
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
        styles.announcement,
        getPositionClass(position),
        getTypeClass(type),
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={combinedClassName} {...props}>
            <div className={styles.content}>{children}</div>

            <button
                onClick={handleClose}
                className={styles.closeButton}
                aria-label={t('aria.closeAnnouncement')}
                type='button'
            >
                <GrClose size={20} />
            </button>
        </div>
    );
};

export default Announcement;
