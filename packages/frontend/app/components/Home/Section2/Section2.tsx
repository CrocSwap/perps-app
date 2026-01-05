import {
    FaDiscord,
    // FaGithub
} from 'react-icons/fa';
import { FaMedium } from 'react-icons/fa6';
import { IoDocumentTextSharp } from 'react-icons/io5';
// import { FiTool } from 'react-icons/fi';
// import { useTermsAgreed } from '../../../App/hooks/useTermsAgreed';
// import useMediaQuery from '../../../utils/hooks/useMediaQuery';
import styles from './Section2.module.css';
import useMediaQuery from '~/hooks/useMediaQuery';
import { externalURLs } from '~/utils/Constants';
import type { JSX } from 'react';
const TERMS_OF_SERVICE_LINK = 'https://ambient.finance/terms';
const PRIVACY_POLICY_LINK = 'https://ambient.finance/privacy';
const MEDIUM_LINK = 'https://crocswap.medium.com/';

interface LinkCardProps {
    label: string;
    text: string;
    link: string;
    linkLabel: string;
    icon: JSX.Element;
}

function LinkCard({ label, text, link, linkLabel, icon }: LinkCardProps) {
    const showDesktopVersion = useMediaQuery('(min-width: 600px)');

    return (
        <a
            className={styles.link_card_container}
            href={link}
            rel='noreferrer'
            target='_blank'
        >
            <div className={styles.link_card_header}>
                <h3>{label}</h3>
                <div className={styles.link_card_icon_container}>{icon}</div>
            </div>
            {showDesktopVersion && <p>{text}</p>}
            <div className={styles.link_card_link_container}>
                <p className={styles.link_text}>{linkLabel}</p>
            </div>
        </a>
    );
}

export default function Section2() {
    // const [, , termsUrls] = useTermsAgreed();

    const twitterSvg = (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='13'
            height='13'
            viewBox='0 0 1200 1227'
            fill='none'
        >
            <path
                d='M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z'
                fill='var(--text2)'
            />
        </svg>
    );

    const linksData = [
        {
            label: 'X / Twitter',
            text: 'Follow the latest from Ambient Finance',
            link: externalURLs.twitter,
            linkLabel: 'x.com/ambient_finance',
            icon: twitterSvg,
        },
        {
            label: 'Discord',
            text: 'Join in the discussion',
            link: externalURLs.discord,
            linkLabel: 'discord.gg/ambient-finance',
            icon: <FaDiscord />,
        },
        {
            label: 'Blog',
            text: 'Find our industry leading articles',
            link: MEDIUM_LINK,
            linkLabel: 'crocswap.medium.com',
            icon: <FaMedium />,
        },
        // {
        //     label: 'Docs',
        //     text: 'Dive into the details',
        //     link: 'DOCS_LINK',
        //     linkLabel: 'docs.ambient.finance',
        //     icon: <IoDocumentTextSharp />,
        // },
        // {
        //     label: 'SDK',
        //     text: 'Seemlessly integrate with Ambient Finance',
        //     link: 'https://github.com/CrocSwap/sdk',
        //     linkLabel: 'github.com/CrocSwap/sdk',
        //     icon: <FiTool />,
        // },
        // {
        //     label: 'Github',
        //     text: 'View our code',
        //     link: 'https://github.com/CrocSwap',
        //     linkLabel: 'github.com/CrocSwap',
        //     icon: <FaGithub />,
        // },
        {
            label: 'Terms of Service',
            text: 'Our rules for using the platform',
            link: 'v2/terms',
            linkLabel: 'perps.ambient.finance/terms',
            icon: <IoDocumentTextSharp />,
        },
        {
            label: 'Privacy Policy',
            text: 'View our policies around data',
            link: '/v2/privacy',
            linkLabel: 'perps.ambient.finance/privacy',
            icon: <IoDocumentTextSharp />,
        },
        // {
        //     label: 'Whitepaper',
        //     text: 'Read our influential whitepaper here',
        //     link: 'https://crocswap-whitepaper.netlify.app/',
        //     linkLabel: 'CrocSwap Whitepaper',
        //     icon: <IoDocumentTextSharp />,
        // },
    ];

    return (
        <div className={styles.sub_container}>
            <h2>Links</h2>

            <div className={styles.links_container}>
                {linksData.map((item, idx) => (
                    <LinkCard
                        key={item.label + idx}
                        label={item.label}
                        text={item.text}
                        link={item.link}
                        linkLabel={item.linkLabel}
                        icon={item.icon}
                    />
                ))}
            </div>
        </div>
    );
}
