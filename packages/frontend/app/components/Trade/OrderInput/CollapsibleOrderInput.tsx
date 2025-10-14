import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './CollapsibleOrderInput.module.css';
import { FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { TbArrowAutofitWidth } from 'react-icons/tb';

type Props = {
    children: React.ReactNode;
    collapsed?: number;
    expanded?: number;
};

export default function CollapsibleOrderInput({
    children,
    collapsed = 30,
    expanded = 360,
}: Props) {
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) =>
            e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <motion.aside
            aria-label='Order Input'
            aria-expanded={open}
            className={styles.root}
            animate={{ width: open ? expanded : collapsed }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        >
            <button
                type='button'
                aria-label={
                    open ? 'Collapse order input' : 'Expand order input'
                }
                onClick={() => setOpen((v) => !v)}
                className={styles.handle}
            >
                <TbArrowAutofitWidth size={20} />
                {open ? (
                    <FiChevronsRight size={24} />
                ) : (
                    <FiChevronsLeft size={24} />
                )}
            </button>

            <motion.div
                className={styles.content}
                initial={false}
                animate={{ opacity: open ? 1 : 0 }}
                transition={{ duration: 0.18 }}
            >
                {open && <div className={styles.container}>{children}</div>}
            </motion.div>
        </motion.aside>
    );
}
