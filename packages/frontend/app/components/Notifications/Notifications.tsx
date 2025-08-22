import { useEffect, useMemo, useRef, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useLocation } from 'react-router';
import { useVersionCheck } from '~/hooks/useVersionCheck';
import { useViewed } from '~/stores/AlreadySeenStore';
import { useAppOptions } from '~/stores/AppOptionsStore';
import SimpleButton from '../SimpleButton/SimpleButton';
import styles from './Notifications.module.css';

interface NewsItemIF {
    headline: string;
    body: string;
    id: string;
}

export default function Notifications() {
    const { enableBackgroundFillNotif } = useAppOptions();
    const backgroundFillNotifRef = useRef(false);
    backgroundFillNotifRef.current = enableBackgroundFillNotif;

    const { showReload, setShowReload } = useVersionCheck();

    const version = null;

    // logic to fetch news data asynchronously
    const [news, setNews] = useState<NewsItemIF[]>([]);
    useEffect(() => {
        fetch('/announcements.json', { cache: 'no-store' })
            .then((res) => res.json())
            .then((formatted) => {
                setNews(formatted.news);
            });
        const interval = setInterval(
            () => {
                fetch('/announcements.json', { cache: 'no-store' })
                    .then((res) => res.json())
                    .then((formatted) => {
                        setNews(formatted.news);
                    });
            },
            5 * 60 * 1000,
        );
        return () => clearInterval(interval);
    }, []);

    // logic to prevent a user from seeing a news item repeatedly
    const alreadyViewed = useViewed();

    // apply filter to messages received by the app
    const unseen: {
        messages: {
            headline: string;
            body: string;
        }[];
        hashes: string[];
    } = useMemo(() => {
        // output variable for human-readable messages
        const messages: {
            headline: string;
            body: string;
        }[] = [];
        // output variable for message hashes
        const hashes: string[] = [];
        // iterate over news items, handle ones not previously seen
        news.forEach((n: NewsItemIF) => {
            if (!alreadyViewed.checkIfViewed(n.id)) {
                messages.push({
                    headline: n.headline,
                    body: n.body,
                });
                hashes.push(n.id);
            }
        });
        // return output variables
        return {
            messages,
            hashes,
        };
    }, [
        // recalculate for changes in the base data set
        news,
        // recalculate for changes in the list of viewed messages
        alreadyViewed,
    ]);

    const [userClosedNews, setUserClosedNews] = useState<boolean>(false);

    const { pathname } = useLocation();

    if (pathname === '/') {
        return <></>;
    }

    return (
        <div className={styles.notifications}>
            {showReload && (
                <div className={styles.new_version_available}>
                    <header>
                        <div />
                        <div>🚀</div>
                        <MdClose
                            onClick={() => setShowReload(false)}
                            color='var(--text2)'
                            size={16}
                        />
                    </header>
                    <div className={styles.text_content}>
                        <h3>New Version Available</h3>
                        <p>
                            {version
                                ? `Version ${version} is ready to install with new features and improvements.`
                                : 'A new version is ready with exciting updates and bug fixes.'}
                        </p>
                    </div>
                    <SimpleButton
                        onClick={() => {
                            window.location.reload();
                            setShowReload(false);
                        }}
                    >
                        Update Now
                    </SimpleButton>
                </div>
            )}
            {unseen.messages.length > 0 && !userClosedNews && (
                <div className={styles.news}>
                    <header>
                        <h4>Announcements</h4>
                        <MdClose
                            color='var(--text2)'
                            size={16}
                            onClick={() => {
                                setUserClosedNews(true);
                                alreadyViewed.markAsViewed(unseen.hashes);
                            }}
                        />
                    </header>
                    <ul>
                        {unseen.messages.map(
                            (n: { headline: string; body: string }) => (
                                <li>
                                    <h5>{n.headline}</h5>
                                    <p>{n.body}</p>
                                </li>
                            ),
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
