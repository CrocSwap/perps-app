import styles from './DepositsWithdrawalsTable.module.css';
import { formatTimestamp } from '~/utils/orderbook/OrderBookUtils';

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
    const { transaction } = props;
    const d = transaction.delta as any;

    const getStatusFromDelta = (type: string): string => {
        return 'Completed';
    };

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
        const d = tx.delta as any;
        if (d.type === 'spotTransfer') {
            return TOKEN_TO_NETWORK[d.token] || 'Unknown';
        }
        return 'FOGO';
    }

    function getAction(tx: TransactionData): string {
        const d = tx.delta as any;
        switch (d.type) {
            case 'deposit':
            case 'accountClassTransfer':
            case 'vaultDeposit':
                return 'Deposit';
            case 'withdraw':
                return 'Withdrawal';
            case 'spotTransfer': {
                return 'Spot Transfer';
            }
            default:
                return 'Unknown';
        }
    }

    function getValueChange(tx: TransactionData): string {
        const d = tx.delta as any;

        if (d.type === 'spotTransfer') {
            if (['HYPE', 'USOL'].includes(d.token)) {
                const amt =
                    parseFloat(d.amount) - parseFloat(d.nativeTokenFee || '0');
                return `-${amt.toFixed(7)} ${d.token}`;
            }
            if (d.token === 'UBTC') {
                const btcPriceUsd = 89_000; // not accurate
                const btc = parseFloat(d.usdcValue) / btcPriceUsd;
                return `-${btc.toFixed(3)} BTC`;
            }
            if (d.token === 'UETH') {
                const ethPriceUsd = 1_900;
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
        const d = tx.delta as any;
        if (d.nativeTokenFee && +d.nativeTokenFee > 0) {
            return `${parseFloat(d.nativeTokenFee).toFixed(7)} ${getToken(getNetwork(tx))}`;
        }
        if (d.fee) {
            return `${parseFloat(d.fee).toFixed(7)} ${getToken(getNetwork(tx))}`;
        }
        return '--';
    }

    function getToken(network: string): string {
        switch (d.type) {
            case 'Hyperliquid':
                return 'HYPE';
            case 'Solana':
                return 'SOL';
            case 'Etherium': {
                return 'ETH';
            }
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
