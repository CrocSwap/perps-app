import { type ReactNode } from 'react';
import { ImSpinner8 } from 'react-icons/im';
import {
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline,
    IoClose,
} from 'react-icons/io5';
import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './Notification.module.css';

interface propsIF {
    data: {
        // title text for the toast
        title: string;
        // message body text for the toast
        message: string;
        // string indicating the icon to consume (defined in this file)
        icon: string;
        // id for individual toasts, used for updates and dismissal
        toastId: number;
        // time after with to remove a toast
        removeAfter?: number;
        // link to open if the user clicks the toast (optional)
        txLink?: string;
    };
    dismiss: (id: number) => void;
    onMouseEnter?: (slug: number) => void;
    onMouseLeave?: (slug: number) => void;
    shouldPauseDismissal?: boolean;
}

export default function Notification(props: propsIF) {
    const { data, dismiss } = props;

    // create and memoize the UNIX time when this element was mounted
    const { getBsColor } = useAppSettings();

    // px size at which to render SVG icons
    const ICON_SIZE = 24;

    // logic to add green syntax highlighting to Bought notifications
    function formatMessage(message: string): ReactNode {
        if (!message) return;
        const fixedMessage: string = message.trim();
        if (fixedMessage.startsWith('Bought')) {
            const firstSpace = fixedMessage.indexOf(' ');
            const secondSpace = fixedMessage.indexOf(' ', firstSpace + 1);
            const thirdSpace = fixedMessage.indexOf(' ', secondSpace + 1);

            if (thirdSpace !== -1) {
                const firstPart = fixedMessage.substring(0, thirdSpace);
                const secondPart = fixedMessage.substring(thirdSpace);

                return (
                    <>
                        <span style={{ color: getBsColor().buy }}>
                            {firstPart}
                        </span>
                        {secondPart}
                    </>
                );
            }
        } else if (fixedMessage.startsWith('Sold')) {
            const firstSpace = fixedMessage.indexOf(' ');
            const secondSpace = fixedMessage.indexOf(' ', firstSpace + 1);
            const thirdSpace = fixedMessage.indexOf(' ', secondSpace + 1);

            if (thirdSpace !== -1) {
                const firstPart = fixedMessage.substring(0, thirdSpace);
                const secondPart = fixedMessage.substring(thirdSpace);

                return (
                    <>
                        <span style={{ color: getBsColor().sell }}>
                            {firstPart}
                        </span>
                        {secondPart}
                    </>
                );
            }
        }
        return fixedMessage;
    }

    return (
        <section className={styles.notification}>
            <header>
                <div className={styles.header_content}>
                    {data.icon === 'spinner' && (
                        <div className={styles.rotate}>
                            <ImSpinner8
                                size={ICON_SIZE}
                                color='var(--accent1)'
                            />
                        </div>
                    )}
                    {data.icon === 'check' && (
                        <IoCheckmarkCircleOutline
                            size={ICON_SIZE}
                            color='var(--accent1)'
                        />
                    )}
                    {data.icon === 'error' && (
                        <IoAlertCircleOutline
                            size={ICON_SIZE}
                            color='var(--red)'
                        />
                    )}
                    <h2>{data.title}</h2>
                </div>
                <IoClose
                    className={styles.close}
                    size={ICON_SIZE}
                    onClick={() => dismiss(data.toastId)}
                />
            </header>
            <p>{formatMessage(data.message)}</p>
            {data.txLink && (
                <a
                    href={data.txLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.txLink}
                >
                    View on explorer
                </a>
            )}
        </section>
    );
}
