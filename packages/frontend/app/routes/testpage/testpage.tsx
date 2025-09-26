import { useState } from 'react';
import PortfolioWithdraw from '~/components/Portfolio/PortfolioWithdraw/PortfolioWithdraw';
import TakeProfitsModal from '~/components/Trade/TakeProfitsModal/TakeProfitsModal';
import Modal from '~/components/Modal/Modal';
import styles from './testpage.module.css';

export default function testpage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mock position data
    const mockPosition = {
        coin: 'BTC',
        szi: 0.5, // Position size (positive = long, negative = short)
        entryPx: 65000, // Entry price
        positionValue: 32500,
        unrealizedPnl: 2500,
        returnOnEquity: 0.08,
        liquidationPx: 45000,
        marginUsed: 6500,
        leverage: { value: 5 },
        cumFunding: {
            sinceOpen: -25.5,
            allTime: -150.2,
            sinceChange: -12.8,
        },
        tp: 70000, // Take profit price
        sl: 60000, // Stop loss price
    };

    const mockMarkPrice = 67500; // Current market price

    return (
        <div className={styles.testpage}>
            <button onClick={() => setIsModalOpen(true)}>
                Open Take Profits Modal
            </button>

            {isModalOpen && (
                <Modal
                    close={() => setIsModalOpen(false)}
                    title='TP/SL for Position'
                >
                    <TakeProfitsModal
                        closeTPModal={() => setIsModalOpen(false)}
                        position={mockPosition}
                        markPrice={mockMarkPrice}
                    />
                </Modal>
            )}
        </div>
    );
}
