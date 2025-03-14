import { useChartStore } from '~/stores/TradingviewChartStore';

export const saveChartLayout = (tvWidget: any) => {
    setTimeout(() => {
        tvWidget.save((state: object) => {
            useChartStore.getState().saveLayout(state);
        });
    }, 100);
};
export const loadChartDrawState = (tvWidget: any) => {
    const savedState = useChartStore.getState().loadLayout();
    if (savedState) {
        tvWidget.load(savedState);
    }
};
