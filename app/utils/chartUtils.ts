import type { IChartingLibraryWidget } from '~/tv/charting_library';
import type { colorSetIF } from '~/stores/AppSettingsStore';

let chartInstance: IChartingLibraryWidget | null = null;

export function setChartInstance(chart: IChartingLibraryWidget | null) {
  chartInstance = chart;
}

export function getChartInstance() {
  return chartInstance;
}

export function applyChartColors(colors: colorSetIF) {
  if (chartInstance) {
    chartInstance.applyOverrides({
      'mainSeriesProperties.candleStyle.upColor': colors.buy,
      'mainSeriesProperties.candleStyle.downColor': colors.sell,
      'mainSeriesProperties.candleStyle.borderUpColor': colors.buy,
      'mainSeriesProperties.candleStyle.borderDownColor': colors.sell,
      'mainSeriesProperties.candleStyle.wickUpColor': colors.buy,
      'mainSeriesProperties.candleStyle.wickDownColor': colors.sell,
    });
  }
}