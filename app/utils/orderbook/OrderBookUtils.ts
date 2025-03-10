import type { OrderRowResolutionIF } from "./OrderBookIFs";


  export const calculateResolutionValue = (price: number, nsigfigs = 2, mantissa?: number) => {
    const magnitude = Math.floor(Math.log10(price));
    const exponent = magnitude - (nsigfigs - 1);
    const tickSize = Math.pow(10, exponent);
    return tickSize * (mantissa || 1);
  }
  
  export const createResolutionObject = (price: number, nsigfigs: number, mantissa?: number) => {
    return {
        nsigfigs: nsigfigs,
        val: calculateResolutionValue(price, nsigfigs, mantissa || 1),
        mantissa: mantissa || null,
    }
  }

  const floorNum = (num: number, precision?: number) => {
    if(precision) {
        return Math.floor(num * Math.pow(10, precision));
    }
    return Math.floor(num);
  }
  
  export const parseNum = (val : string | number) => {
    return Number(val);
  }

  export const formatDateToTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {hour12: false});
  }

  
  export const getResolutionListForPrice = (price: number | string): OrderRowResolutionIF[] => {
  
      
    const ret: OrderRowResolutionIF[] = [];
    
    const priceNum = Number(price);
    ret.push(createResolutionObject(priceNum, 5));
    ret.push(createResolutionObject(priceNum, 5, 2));
    ret.push(createResolutionObject(priceNum, 5, 5));
    ret.push(createResolutionObject(priceNum, 4));
    ret.push(createResolutionObject(priceNum, 3));
    ret.push(createResolutionObject(priceNum, 2));
    
    return ret;
  }


 export const getTimeUntilNextHour = () => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);

    const diff = Math.floor((nextHour.getTime() - now.getTime()) / 1000);
    const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');

    return `00:${minutes}:${seconds}`;
}