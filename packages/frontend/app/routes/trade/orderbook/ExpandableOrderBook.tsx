import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './ExpandableOrderBook.module.css';
import { HiOutlineTableCells, HiTableCells } from 'react-icons/hi2';
import { FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

type Props = {
    children: React.ReactNode;
    collapsed?: number;
    expanded?: number;
};

export default function ExpandableOrderBook({
    children,
    collapsed = 30,
    expanded = 320,
}: Props) {
    const [open, setOpen] = useState(false);

    // Close with ESC
    useEffect(() => {
        const onKey = (e: KeyboardEvent) =>
            e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <motion.aside
            aria-label='Order book'
            aria-expanded={open}
            className={styles.root}
            animate={{ width: open ? expanded : collapsed }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ overflowY: 'hidden' }}
        >
            {/* Toggle handle (always visible) */}
            <button
                type='button'
                aria-label={open ? 'Collapse order book' : 'Expand order book'}
                onClick={() => setOpen((v) => !v)}
                className={styles.handle}
            >
                {/* Simple chevron using CSS; no icon lib needed */}
                {open ? (
                    <FiChevronsRight size={20} color='var(--text2)' />
                ) : (
                    <FiChevronsLeft size={20} color='var(--text2)' />
                )}
                <HiOutlineTableCells size={20} color='var(--text2)' />
                {open ? (
                    <FiChevronsRight size={20} color='var(--text2)' />
                ) : (
                    <FiChevronsLeft size={20} color='var(--text2)' />
                )}

                <span
                    className={`${styles.chev} ${open ? styles.right : styles.left}`}
                />
            </button>

            {/* Only render content when open so your height math runs at the right time */}
            <motion.div
                className={styles.content}
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.18 }}
            >
                {open && (
                    <div id='orderBookContainer' className={styles.container}>
                        {children}
                    </div>
                )}
            </motion.div>
        </motion.aside>
    );
}
