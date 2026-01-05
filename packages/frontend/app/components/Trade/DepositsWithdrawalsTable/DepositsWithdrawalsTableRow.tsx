import { useTranslation } from 'react-i18next';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';
import styles from './DepositsWithdrawalsTable.module.css';

export interface TransactionData {
    time: number;
    hash: string;
    user: string;
    delta:
        | DepositDelta
        | AccountClassTransferDelta
        | VaultDepositDelta
        | SpotTransferDelta
        | WithdrawDelta;
}

interface DepositDelta {
    type: 'deposit';
    usdc: string;
}

interface AccountClassTransferDelta {
    type: 'accountClassTransfer';
    usdc: string;
    toPerp: boolean;
}

interface VaultDepositDelta {
    type: 'vaultDeposit';
    vault: string;
    usdc: string;
}

interface SpotTransferDelta {
    type: 'spotTransfer';
    token: string;
    amount: string;
    usdcValue: string;
    user: string;
    destination: string;
    fee: string;
    nativeTokenFee: string;
    nonce: number;
}

interface WithdrawDelta {
    type: 'withdraw';
    usdc: string;
    nonce: number;
    fee: string;
}

interface DepositsWithdrawalsTableRowProps {
    transaction: TransactionData;
}

export default function DepositsWithdrawalsTableRow(
    props: DepositsWithdrawalsTableRowProps,
) {
    const { t } = useTranslation();
    const { transaction } = props;

    const getStatusFromDelta = (type: string): string =>
        t('tradeTable.completed');

    const TOKEN_TO_NETWORK: Record<string, string> = {
        HYPE: 'Hyperliquid',
        PURR: 'Hyperliquid',
        UFART: 'Solana',
        FARTCOIN: 'Solana',
        USOL: 'Solana',
        UETH: 'Ethereum',
        UBTC: 'Bitcoin',
        USDT0: 'Ethereum',
    };

    function getNetwork(tx: TransactionData): string {
        const d = tx.delta as
            | DepositDelta
            | AccountClassTransferDelta
            | VaultDepositDelta
            | SpotTransferDelta
            | WithdrawDelta;
        if (d.type === 'spotTransfer') {
            return TOKEN_TO_NETWORK[d.token] || t('common.unknown');
        }
        return 'FOGO';
    }

    function getAction(tx: TransactionData): string {
        const d = tx.delta as
            | DepositDelta
            | AccountClassTransferDelta
            | VaultDepositDelta
            | SpotTransferDelta
            | WithdrawDelta;
        switch (d.type) {
            case 'deposit':
            case 'accountClassTransfer':
            case 'vaultDeposit':
                return t('common.deposit');
            case 'withdraw':
                return t('tradeTable.withdrawal');
            case 'spotTransfer':
                return t('tradeTable.spotTransfer');
            default:
                return t('common.unknown');
        }
    }

    function getValueChange(tx: TransactionData): string {
        const d = tx.delta as
            | DepositDelta
            | AccountClassTransferDelta
            | VaultDepositDelta
            | SpotTransferDelta
            | WithdrawDelta;
        if (d.type === 'spotTransfer') {
            if (['HYPE', 'USOL'].includes(d.token)) {
                const amt =
                    parseFloat(d.amount) - parseFloat(d.nativeTokenFee || '0');
                return `-${amt.toFixed(7)} ${d.token}`;
            }
            if (d.token === 'UBTC') {
                const btcPriceUsd = 89000;
                const btc = parseFloat(d.usdcValue) / btcPriceUsd;
                return `-${btc.toFixed(3)} BTC`;
            }
            if (d.token === 'UETH') {
                const ethPriceUsd = 1900;
                const eth = parseFloat(d.usdcValue) / ethPriceUsd;
                return `-${eth.toFixed(2)} ETH`;
            }
            const usd = parseFloat(d.usdcValue);
            return `-${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`;
        }
        if (d.type === 'withdraw') {
            const usd = parseFloat(d.usdc);
            return `-${usd.toLocaleString(undefined, { maximumFractionDigits: 7 })} SOL`;
        }
        if (d.type === 'deposit') {
            const usd = parseFloat(d.usdc);
            return `+${usd.toFixed(0)} USDT`;
        }
        if (d.type === 'accountClassTransfer') {
            const amt = parseFloat(d.usdc) * (d.toPerp ? -1 : 1);
            return `${amt >= 0 ? '+' : ''}${amt.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT`;
        }
        return '';
    }

    function getFee(tx: TransactionData): string {
        const d = tx.delta as SpotTransferDelta;
        if (d.nativeTokenFee && +d.nativeTokenFee > 0) {
            return `${parseFloat(d.nativeTokenFee).toFixed(7)} ${getToken(getNetwork(tx))}`;
        }
        if (d.fee) {
            return `${parseFloat(d.fee).toFixed(7)} ${getToken(getNetwork(tx))}`;
        }
        return '--';
    }

    function getToken(network: string): string {
        switch (network) {
            case 'Hyperliquid':
                return 'HYPE';
            case 'Solana':
                return 'SOL';
            case 'Ethereum':
                return 'ETH';
            case 'Bitcoin':
                return 'BTC';
            default:
                return 'HYPE';
        }
    }

    const status = getStatusFromDelta(transaction.delta.type);
    const network = getNetwork(transaction);
    const action = getAction(transaction);
    const valueChange = getValueChange(transaction);
    const fee = getFee(transaction);

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.cell} ${styles.timeCell}`}>
                {formatTimestamp(transaction.time)}
            </div>
            <div className={`${styles.cell} ${styles.statusCell}`}>
                {status}
            </div>
            <div className={`${styles.cell} ${styles.networkCell}`}>
                {network}
            </div>
            <div className={`${styles.cell} ${styles.actionCell}`}>
                {action}
            </div>
            <div className={`${styles.cell} ${styles.valueChangeCell}`}>
                {valueChange}
            </div>
            <div className={`${styles.cell} ${styles.feeCell}`}>{fee}</div>
        </div>
    );
}
