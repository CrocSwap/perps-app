import React from 'react';
import styles from './LogoLoadingIndicator.module.css';

export default function LogoLoadingIndicator() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.logoMask} aria-label='Loading' />
        </div>
    );
}
