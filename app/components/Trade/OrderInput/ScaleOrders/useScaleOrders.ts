import { useState, useEffect, useMemo } from 'react';

// Constants
export const PRICE_DISTRIBUTION_TYPES = {
  FLAT: 'flat',
  INCREASING: 'increasing',
  DECREASING: 'decreasing'
} as const;

export const RATIO_DISTRIBUTION_TYPES = {
  EVENLY_SPLIT: 'evenlySplit',
  INCREASING: 'increasing',
  DECREASING: 'decreasing'
} as const;

// Types
export type PriceDistributionType = typeof PRICE_DISTRIBUTION_TYPES[keyof typeof PRICE_DISTRIBUTION_TYPES];
export type RatioDistributionType = typeof RATIO_DISTRIBUTION_TYPES[keyof typeof RATIO_DISTRIBUTION_TYPES];

export interface OrderRow {
  price: number;
  ratio: number;
  quantity: number;
}

interface UseScaleOrdersProps {
  minPrice: number;
  maxPrice: number;
  totalQuantity: number;
  totalOrders: number;
}

export default function useScaleOrders({
  minPrice,
  maxPrice,
  totalQuantity,
  totalOrders
}: UseScaleOrdersProps) {
  // State
  const [priceDistribution, setPriceDistribution] = useState<PriceDistributionType>(PRICE_DISTRIBUTION_TYPES.FLAT);
  const [ratioDistribution, setRatioDistribution] = useState<RatioDistributionType>(RATIO_DISTRIBUTION_TYPES.EVENLY_SPLIT);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);

  // Generate evenly spaced price points between min and max
  const generateFlatPrices = (count: number): number[] => {
    const step = (maxPrice - minPrice) / (count - 1 || 1);
    return Array.from({ length: count }, (_, i) => 
      +(minPrice + i * step).toFixed(1)
    );
  };

  // Generate prices based on distribution
  const generatePrices = (): number[] => {
    const count = totalOrders;
    let prices: number[] = [];
    
    if (priceDistribution === PRICE_DISTRIBUTION_TYPES.FLAT) {
      // Evenly spaced prices
      prices = generateFlatPrices(count);
    } 
    else if (priceDistribution === PRICE_DISTRIBUTION_TYPES.INCREASING) {
      // More prices concentrated near the higher end
      // Based on Image 2 - More steps at higher prices
      const flatPrices = generateFlatPrices(count);
      const adjustedPrices = flatPrices.map((_, index) => {
        // Power function with exponent > 1 to concentrate at higher end
        const t = Math.pow(index / (count - 1), 1.5);
        return minPrice + t * (maxPrice - minPrice);
      });
      prices = adjustedPrices.map(p => +p.toFixed(1));
    } 
    else if (priceDistribution === PRICE_DISTRIBUTION_TYPES.DECREASING) {
      // From Image 3, decreasing means highest price first, lowest last
      // We need prices in descending order
      prices = generateFlatPrices(count).reverse();
    }
    
    return prices;
  };

  // Generate ratios based on distribution
  const generateRatios = (): number[] => {
    const count = totalOrders;
    
    if (ratioDistribution === RATIO_DISTRIBUTION_TYPES.EVENLY_SPLIT) {
      // All get the same ratio (20% each for 5 orders)
      const ratio = 100 / count;
      return Array(count).fill(+ratio.toFixed(2));
    } 
    else if (ratioDistribution === RATIO_DISTRIBUTION_TYPES.INCREASING) {
      // Based on Image 6 - Higher ratios for higher prices
      // Generate a sequence with increasing values
      // Example for 5 orders: 6.67%, 13.33%, 20%, 26.67%, 33.33%
      let total = (count * (count + 1)) / 2; // Sum of 1+2+3+...+n
      let ratios = Array.from({ length: count }, (_, i) => {
        const weight = i + 1;
        return +(weight * 100 / total).toFixed(2);
      });
      return ratios;
    } 
    else if (ratioDistribution === RATIO_DISTRIBUTION_TYPES.DECREASING) {
      // Based on Image 4 - Higher ratios for lower prices
      // Example for 5 orders: 33.33%, 26.67%, 20%, 13.33%, 6.67%
      let total = (count * (count + 1)) / 2; // Sum of 1+2+3+...+n
      let ratios = Array.from({ length: count }, (_, i) => {
        const weight = count - i;
        return +(weight * 100 / total).toFixed(2);
      });
      return ratios;
    }
    
    // Default case (should never happen)
    return Array(count).fill(+(100 / count).toFixed(2));
  };

  // Generate orders based on current settings
  const generateOrders = () => {
    // Get prices based on the selected distribution
    const prices = generatePrices();
    
    // Get ratios based on the selected distribution
    let ratios = generateRatios();
    
    // Ensure ratios add up to exactly 100%
    const ratioSum = ratios.reduce((sum, r) => sum + r, 0);
    if (Math.abs(ratioSum - 100) > 0.01) {
      // Adjust the first ratio to make the sum exactly 100%
      ratios[0] = +(ratios[0] + (100 - ratioSum)).toFixed(2);
    }
    
    // Create order objects
    const newOrders = prices.map((price, index) => {
      const ratio = ratios[index];
      const quantity = +(ratio * totalQuantity / 100).toFixed(3);
      
      return {
        price,
        ratio,
        quantity
      };
    });
    
    setOrders(newOrders);
  };

  // Calculate total ratio and check if valid
  const totalRatio = useMemo(() => 
    +orders.reduce((sum, order) => sum + order.ratio, 0).toFixed(2),
    [orders]
  );
  
  const isValidRatio = useMemo(() => 
    Math.abs(totalRatio - 100) < 0.1,
    [totalRatio]
  );

  // Update orders when any parameters change
  useEffect(() => {
    generateOrders();
  }, [totalOrders, priceDistribution, ratioDistribution, minPrice, maxPrice, totalQuantity]);

  // Update a specific order's ratio
  const updateOrderRatio = (index: number, newRatio: number) => {
    const newOrders = [...orders];
    const oldRatio = newOrders[index].ratio;
    const difference = newRatio - oldRatio;
    
    // Update the ratio for this order
    newOrders[index].ratio = +newRatio.toFixed(2);
    
    // Adjust other ratios proportionally to maintain 100% total
    if (Math.abs(difference) > 0.01) {
      const otherOrders = newOrders.filter((_, i) => i !== index);
      const totalOtherRatio = otherOrders.reduce((sum, order) => sum + order.ratio, 0);
      
      if (totalOtherRatio > 0) {
        otherOrders.forEach(order => {
          const orderIndex = newOrders.findIndex(o => o === order);
          const adjustmentFactor = order.ratio / totalOtherRatio;
          newOrders[orderIndex].ratio = +(order.ratio - difference * adjustmentFactor).toFixed(2);
        });
      }
    }
    
    // Update quantities based on new ratios
    newOrders.forEach(order => {
      order.quantity = +(order.ratio * totalQuantity / 100).toFixed(3);
    });
    
    setOrders(newOrders);
  };

  // Update a specific order's quantity
  const updateOrderQuantity = (index: number, newQuantity: number) => {
    const newRatio = +(newQuantity / totalQuantity * 100).toFixed(2);
    updateOrderRatio(index, newRatio);
  };

  return {
    orders,
    priceDistribution,
    setPriceDistribution,
    ratioDistribution,
    setRatioDistribution,
    isPriceDropdownOpen,
    setIsPriceDropdownOpen,
    isRatioDropdownOpen,
    setIsRatioDropdownOpen,
    totalRatio,
    isValidRatio,
    updateOrderRatio,
    updateOrderQuantity
  };
}