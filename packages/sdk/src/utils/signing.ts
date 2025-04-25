import type { Cloid } from './types';

export type Tif = 'Alo' | 'Ioc' | 'Gtc';
export type Tpsl = 'tp' | 'sl';
export interface LimitOrderType {
    tif: Tif;
}
export interface TriggerOrderType {
    triggerPx: number;
    isMarket: boolean;
    tpsl: Tpsl;
}
export interface TriggerOrderTypeWire {
    triggerPx: string;
    isMarket: boolean;
    tpsl: Tpsl;
}
export type OrderType = { limit?: LimitOrderType; trigger?: TriggerOrderType };
export type OrderTypeWire = {
    limit?: LimitOrderType;
    trigger?: TriggerOrderTypeWire;
};

export interface OrderRequest {
    coin: string;
    is_buy: boolean;
    sz: number;
    limit_px: number;
    order_type: OrderType;
    reduce_only: boolean;
    cloid?: any;
}

export type OidOrCloid = number | Cloid;
export interface ModifyRequest {
    oid: OidOrCloid;
    order: OrderRequest;
}
export interface CancelRequest {
    coin: string;
    oid: number;
}
export interface CancelByCloidRequest {
    coin: string;
    cloid: Cloid;
}

export type Grouping = 'na' | 'normalTpsl' | 'positionTpsl';
export interface Order {
    asset: number;
    isBuy: boolean;
    limitPx: number;
    sz: number;
    reduceOnly: boolean;
    cloid?: any;
}

export interface OrderWire {
    a: number;
    b: boolean;
    p: string;
    s: string;
    r: boolean;
    t: OrderTypeWire;
    c?: string;
}

export interface ModifyWire {
    oid: number;
    order: OrderWire;
}

export interface ScheduleCancelAction {
    type: 'scheduleCancel';
    time?: number;
}

export function floatToWire(x: number): string {
    const rounded = x.toFixed(8);
    if (Math.abs(parseFloat(rounded) - x) >= 1e-12) {
        throw new Error('floatToWire causes rounding: ' + x);
    }
    let result = rounded === '-0' ? '0' : rounded;
    result = result.replace(/(\.\d*?[1-9])0+$/g, '$1'); // remove trailing zeros after decimal
    result = result.replace(/\.0+$/, ''); // remove ".0" if integer
    return result;
}

export function floatToIntForHashing(x: number): number {
    return floatToInt(x, 8);
}

export function floatToUsdInt(x: number): number {
    return floatToInt(x, 6);
}

export function floatToInt(x: number, power: number): number {
    const withDecimals = x * Math.pow(10, power);
    if (Math.abs(Math.round(withDecimals) - withDecimals) >= 1e-3) {
        throw new Error('floatToInt causes rounding: ' + x);
    }
    return Math.round(withDecimals);
}

export function getTimestampMs(): number {
    return Date.now();
}

export function orderTypeToWire(orderType: OrderType): OrderTypeWire {
    if ('limit' in orderType && orderType.limit) {
        return { limit: orderType.limit };
    } else if ('trigger' in orderType && orderType.trigger) {
        return {
            trigger: {
                isMarket: orderType.trigger.isMarket,
                triggerPx: floatToWire(orderType.trigger.triggerPx),
                tpsl: orderType.trigger.tpsl,
            },
        };
    }
    throw new Error('Invalid order type: ' + JSON.stringify(orderType));
}

export function orderRequestToOrderWire(
    order: OrderRequest,
    asset: number,
): OrderWire {
    const orderWire: OrderWire = {
        a: asset,
        b: order.is_buy,
        p: floatToWire(order.limit_px),
        s: floatToWire(order.sz),
        r: order.reduce_only,
        t: orderTypeToWire(order.order_type),
    };
    if (
        'cloid' in order &&
        order.cloid != null &&
        typeof order.cloid.toRaw === 'function'
    ) {
        orderWire.c = order.cloid.toRaw();
    }
    return orderWire;
}

export function orderWiresToOrderAction(
    orderWires: OrderWire[],
    builder?: any,
): any {
    const action: any = {
        type: 'order',
        orders: orderWires,
        grouping: 'na',
    };
    if (builder) {
        action.builder = builder;
    }
    return action;
}

function mockSignature() {
    return { r: '0x69', s: '0x69', v: 420 };
}

export function signL1Action(
    _wallet: any,
    _action: any,
    _activePool: any,
    _nonce: number,
    _isMainnet: boolean,
) {
    return mockSignature();
}
