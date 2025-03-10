export interface OrderRowIF{
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

export type OrderBookMode = 'symbol' | 'usd';