import { motion } from 'framer-motion';
import React from 'react';
import { NavLink } from 'react-router';
import styles from './MobileFooter.module.css';
import { RiHome2Line } from 'react-icons/ri';
import { MdOutlinePeopleAlt } from 'react-icons/md';

// Define the navigation item type
interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
    end?: boolean;
    // for exact matching like home
}

const MobileFooter: React.FC = () => {
    const navItems: NavItem[] = [
        {
            name: 'Home',
            path: '/',
            icon: homeSvg,
            end: true,
        },
        {
            name: 'Trade',
            path: '/v2/trade',
            icon: tradeSvg,
        },
        {
            name: 'Referrals',
            path: '/v2/referrals',
            icon: referralsSvg,
        },
        // {
        //     name: 'Account',
        //     path: '/v2/portfolio',
        //     icon: accountSvg,
        // },
        // {
        //     name: 'Chat',
        //     path: '/v2/chat',
        //     icon: chatSvg,
        // },
    ];

    return (
        <nav className={styles.footer}>
            {navItems.map((item) => (
                <NavItem key={item.name} item={item} />
            ))}
        </nav>
    );
};

const NavItem: React.FC<{ item: NavItem }> = React.memo(({ item }) => {
    const { name, path, icon, end } = item;

    return (
        <NavLink
            to={path}
            end={end}
            className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
            }
        >
            <motion.div
                className={styles.iconWrapper}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -2 }}
            >
                <div className={styles.icon}>{icon}</div>
                <span className={styles.label}>{name}</span>
            </motion.div>
        </NavLink>
    );
});

// SVG Components
const tradeSvg = (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='25'
        height='25'
        viewBox='0 0 25 25'
        fill='none'
    >
        <path
            d='M18.84 10.87C19.7853 11.2224 20.6265 11.8075 21.2858 12.5712C21.945 13.3349 22.4011 14.2524 22.6117 15.2391C22.8224 16.2257 22.7809 17.2495 22.491 18.2158C22.2012 19.1822 21.6723 20.0598 20.9534 20.7676C20.2345 21.4754 19.3487 21.9905 18.378 22.2652C17.4072 22.54 16.3829 22.5655 15.3997 22.3395C14.4165 22.1134 13.5061 21.6431 12.7528 20.972C11.9995 20.3009 11.4276 19.4507 11.09 18.5M7.75 6.5H8.75V10.5M17.46 14.38L18.16 15.09L15.34 17.91M14.75 8.5C14.75 11.8137 12.0637 14.5 8.75 14.5C5.43629 14.5 2.75 11.8137 2.75 8.5C2.75 5.18629 5.43629 2.5 8.75 2.5C12.0637 2.5 14.75 5.18629 14.75 8.5Z'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// const exploreSvg = (
//     <svg
//         xmlns='http://www.w3.org/2000/svg'
//         width='25'
//         height='25'
//         viewBox='0 0 25 25'
//         fill='none'
//     >
//         <path
//             d='M12.25 22.5C17.7728 22.5 22.25 18.0228 22.25 12.5C22.25 6.97715 17.7728 2.5 12.25 2.5C6.72715 2.5 2.25 6.97715 2.25 12.5C2.25 18.0228 6.72715 22.5 12.25 22.5Z'
//             stroke='currentColor'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//         />
//         <path
//             d='M16.49 8.26001L14.37 14.62L8.00999 16.74L10.13 10.38L16.49 8.26001Z'
//             stroke='#6A6A6D'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//         />
//     </svg>
// );

// const accountSvg = (
//     <svg
//         xmlns='http://www.w3.org/2000/svg'
//         width='25'
//         height='25'
//         viewBox='0 0 25 25'
//         fill='none'
//     >
//         <path
//             d='M12.75 22.5C18.2728 22.5 22.75 18.0228 22.75 12.5C22.75 6.97715 18.2728 2.5 12.75 2.5C7.22715 2.5 2.75 6.97715 2.75 12.5C2.75 18.0228 7.22715 22.5 12.75 22.5Z'
//             stroke='currentColor'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//         />
//         <path
//             d='M12.75 13.5C14.4069 13.5 15.75 12.1569 15.75 10.5C15.75 8.84315 14.4069 7.5 12.75 7.5C11.0931 7.5 9.75 8.84315 9.75 10.5C9.75 12.1569 11.0931 13.5 12.75 13.5Z'
//             stroke='#6A6A6D'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//         />
//         <path
//             d='M7.75 21.162V19.5C7.75 18.9696 7.96071 18.4609 8.33579 18.0858C8.71086 17.7107 9.21957 17.5 9.75 17.5H15.75C16.2804 17.5 16.7891 17.7107 17.1642 18.0858C17.5393 18.4609 17.75 18.9696 17.75 19.5V21.162'
//             stroke='#6A6A6D'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//         />
//     </svg>
// );

// const chatSvg = (
//     <svg
//         xmlns='http://www.w3.org/2000/svg'
//         width='25'
//         height='25'
//         viewBox='0 0 25 25'
//         fill='none'
//     >
//         <path
//             d='M3.25 21.5L5.15 15.8C4.24713 13.9948 4.01612 11.9272 4.4983 9.96722C4.98049 8.00725 6.1444 6.28282 7.78176 5.10254C9.41911 3.92226 11.423 3.36316 13.4349 3.52528C15.4468 3.6874 17.3354 4.56017 18.7626 5.98741C20.1898 7.41464 21.0626 9.30319 21.2247 11.3151C21.3869 13.327 20.8277 15.3309 19.6475 16.9683C18.4672 18.6056 16.7428 19.7695 14.7828 20.2517C12.8228 20.7339 10.7552 20.5029 8.95 19.6L3.25 21.5Z'
//             stroke='currentColor'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//         />
//     </svg>
// );

const referralsSvg = <MdOutlinePeopleAlt size={23} />;

const homeSvg = <RiHome2Line size={23} />;

export default React.memo(MobileFooter);
