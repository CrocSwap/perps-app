import { useParams } from 'react-router';
import styles from './vaultDetails.module.css';
import { useEffect } from 'react';
import { useDebugStore } from '~/stores/DebugStore';
import WebDataConsumer from '../trade/webdataconsumer';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import { useInfoApi } from '~/hooks/useInfoApi';

interface VaultCardProps {
    title: string;
    value: string;
}

export default function VaultCard(props: VaultCardProps) {
    return (
        <>
            <div className={styles.card}>
                <div className={styles.title}>{props.title}</div>
                <div className={styles.value}>{props.value}</div>
            </div>
        </>
    );
}
