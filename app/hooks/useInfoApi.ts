import { useEffect, useRef, useState } from "react";
import { useWebSocketContext } from "~/contexts/WebSocketContext";
import { processOrderBookMessage } from "~/processors/processOrderBook";
import { useOrderBookStore } from "~/stores/OrderBookStore";


export type ApiCallConfig = {
  type: string;
  handler: (data: any, payload: any) => void;
  payload?: any;
}


export enum ApiEndpoints {
  HISTORICAL_ORDERS = 'historicalOrders',
  OPEN_ORDERS = 'frontendOpenOrders',
}

// const apiUrl = 'https://api-ui.hyperliquid.xyz/info';
const apiUrl = 'https://api.hyperliquid.xyz/info';


export function useInfoApi() {

  const fetchData = async (config: ApiCallConfig) => {
    const payload = {type: config.type, ...config.payload};
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    config.handler(data, payload);
  }
  

  return { fetchData};
}
