export interface OrderBookRowIF{
    coin: string;
    px: number;
    sz: number;
    n: number;
    type: 'buy' | 'sell';
    total: number;
    ratio: number;
  }

export interface OrderBookTradeIF {
  coin: string;
  side: 'buy' | 'sell';
  px: number;
  sz: number;
  hash: string;
  time: number;
  tid: number; // ID unique across all assets
  users: [string, string]
}
  
export interface OrderRowResolutionIF {
val: number;
nsigfigs: number;
mantissa?: number | null;
}

export interface OrderDataIF {
  cloid: string;
  coin: string;
  isPositionTpsl?: boolean;
  isTrigger?: boolean;
  limitPx: number;
  oid: number;
  orderType?: string;
  origSz: number;
  reduceOnly? :boolean;
  side: 'buy' | 'sell';
  sz: number;
  tif?: string;
  timestamp: number;
  triggerCondition?: string;
  triggerPx?: number;
  status: string;

}

export type OrderBookMode = 'symbol' | 'usd';