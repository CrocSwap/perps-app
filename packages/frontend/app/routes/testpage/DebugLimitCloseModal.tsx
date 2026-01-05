// DebugLimitCloseModal.tsx
import LimitCloseModal from '~/components/Trade/LimitCloseModal/LimitCloseModal';
import { useTradeDataStore } from '~/stores/TradeDataStore';

export default function DebugLimitCloseModal() {
    const { positions } = useTradeDataStore();

    // fallback fake position if none exists
    const debugPosition =
        positions?.[0] ??
        ({
            coin: 'BTC',
            szi: 1,
            entryPx: 50000,
            liquidationPx: 30000,
            marginUsed: 1000,
            leverage: { value: 5 },
            positionValue: 50000,
            unrealizedPnl: 0,
            returnOnEquity: 0,
            cumFunding: {
                sinceOpen: 0,
                sinceChange: 0,
                allTime: 0,
            },
        } as any);

    return <LimitCloseModal position={debugPosition} close={() => {}} />;
}
