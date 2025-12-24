import { IoWallet } from 'react-icons/io5';
import { SessionButton } from '@fogo/sessions-sdk-react';
import styles from '../affiliates.module.css';

interface ConnectWalletCardProps {
    title?: string;
    description?: string;
}

export function ConnectWalletCard({
    title = 'Connect your wallet',
    description = 'Sign in to view your data and start earning rewards',
}: ConnectWalletCardProps) {
    return (
        <div className={styles['connect-wallet-card']}>
            <div className={styles['connect-wallet-content']}>
                <div className={styles['connect-wallet-icon']}>
                    <IoWallet />
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                    }}
                >
                    <h3 className={styles['connect-wallet-title']}>{title}</h3>
                    <p className={styles['connect-wallet-description']}>
                        {description}
                    </p>
                </div>

                <SessionButton />
            </div>
        </div>
    );
}
