import { useTranslation } from 'react-i18next';
import { externalURLs } from '~/utils/Constants';
import styles from './Links.module.css';
import {
    FaTwitter,
    FaDiscord,
    FaGithub,
    FaFileAlt,
    FaCog,
    FaPaperPlane,
    FaClipboardList,
    FaBook,
    FaShapes,
} from 'react-icons/fa';

const linksData = [
    {
        title: 'Twitter',
        description: 'Follow the latest from Ambient Finance',
        linkText: '@ambient_finance',
        link: externalURLs.twitter,
        icon: <FaTwitter />,
    },
    {
        title: 'Discord',
        description: 'Join in the discussion',
        linkText: 'discord.gg/ambient-finance',
        link: externalURLs.discord,
        icon: <FaDiscord />,
    },
    {
        title: 'Blog',
        description: 'Read our industry leading articles',
        linkText: 'Medium',
        link: 'https://medium.com',
        icon: <FaPaperPlane />,
    },
    {
        title: 'Docs',
        description: 'Dive into the details',
        linkText: 'Documentation',
        link: '#',
        icon: <FaFileAlt />,
    },
    {
        title: 'SDK',
        description: 'Seamlessly integrate with Ambient Finance',
        linkText: 'Typescript SDK',
        link: '#',
        icon: <FaCog />,
    },
    {
        title: 'Github',
        description: 'View our code',
        linkText: 'Github',
        link: 'https://github.com',
        icon: <FaGithub />,
    },
    {
        title: 'Terms ',
        description: 'Our rules for using the platform',
        linkText: 'TOS',
        link: '#',
        icon: <FaClipboardList />,
    },
    {
        title: 'Privacy Policy',
        description: 'View our policies around data',
        linkText: 'Privacy Policy',
        link: '#',
        icon: <FaBook />,
    },
    {
        title: 'Whitepaper',
        description: 'Read our influential whitepaper here',
        linkText: 'Whitepaper',
        link: '#',
        icon: <FaFileAlt />,
    },
    {
        title: 'Brand Kit',
        description: 'Download our brand kit',
        linkText: 'Brand Kit',
        link: '#',
        icon: <FaShapes />,
    },
];

const Links: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Links</h1>
            <div className={styles.grid}>
                {linksData.map((item, index) => (
                    <div key={index} className={styles.card}>
                        <div className={styles.header}>
                            {item.icon}
                            <h2>{item.title}</h2>
                        </div>
                        <p className={styles.description}>{item.description}</p>
                        <a
                            href={item.link}
                            className={styles.button}
                            target='_blank'
                            rel='noopener noreferrer'
                            aria-label={t('aria.externalLinkOpensNewTab', {
                                linkText: item.linkText,
                            })}
                        >
                            {item.linkText}
                            <span className='sr-only'>
                                {' '}
                                {t('aria.opensInNewTab')}
                            </span>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Links;

/* LinksPage.module.css */
