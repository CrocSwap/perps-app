import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { NumFormatTypes, type NumFormat } from '~/utils/Constants';






export function useNumFormatter() {

  const { numFormat} = useAppSettings();
  
  const parseNum = useCallback((val : string | number) => {
    return Number(val);
  }, []);

  const getDefaultPrecision = useCallback((num: number | string) => {
    const numVal = parseNum(num);
    if(numVal > 1000000){
        return 0;
    }
    else if(numVal < 10){
        return 4;
    }
    return 2;
  }, [parseNum]);




  const formatNum = useCallback((num: number | string, precision?: number) => {

    const formatType = numFormat.value;
    
    if (Number.isInteger(num)) {
      return num.toLocaleString(formatType);
    } else {
      return num.toLocaleString(formatType, {
        minimumFractionDigits: precision || getDefaultPrecision(num),
        maximumFractionDigits: precision || getDefaultPrecision(num)
      });
    }

  }, [numFormat, parseNum, getDefaultPrecision]);

  const formatPriceForChart = useCallback((num: number | string) => {
    const precision = Math.max(5 - Math.floor(Math.log10(Math.abs(parseInt(num.toString())) + 1)), 0) - 1;
    return formatNum(num, precision >= 0 ? precision : 0);
  }, [formatNum]);
  


  return { formatNum, formatPriceForChart };
}

export default useNumFormatter;