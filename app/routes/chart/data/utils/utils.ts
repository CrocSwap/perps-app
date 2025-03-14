import type { LibrarySymbolInfo } from "~/tv/charting_library/charting_library";

export const mapResolutionToInterval = (resolution: string): string => {
  const mapping: Record<string, string> = {
    "1": "1m",
    "5": "5m",
    "15": "15m",
    "60": "1h",
    "240": "4h",
    D: "1d",
    W: "1w",
  };
  return mapping[resolution] || "1d";
};

export function resolutionToSeconds(resolution: string): number {
  if (resolution === "1D") return 86400;
  if (resolution === "W") return 604800;
  if (resolution === "M") return 2592000;

  return Number(resolution);
}


const calculatePrecision = (price: number) => {
  return (
    Math.max(
      5 - Math.floor(Math.log10(Math.abs(parseInt(price.toString())) + 1)),
      0
    ) - 1
  );
};

export const priceFormatterFactory = (
  symbolInfo: LibrarySymbolInfo | null,
  minTick: string
) => {
  if (minTick === "default") {
    return {
      format: (price: number) => {
        const precision = calculatePrecision(price);
        return price.toFixed(precision > 0 ? precision : 0);
      },
    };
  } else {
    const userPrecision = minTick.split(",")[0];

    return {
      format: (price: number) =>
        price.toFixed(Math.log10(Number(userPrecision))),
    };
  }
};
