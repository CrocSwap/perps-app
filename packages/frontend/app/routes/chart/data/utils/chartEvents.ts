import { saveChartLayout } from './chartStorage';

export const drawingEvent = (chart: any) => {
    chart?.subscribe('drawing_event', (id: any, type: any) => {
        if (['properties_changed'].includes(type)) return;
        if (chart) saveChartLayout(chart);
    });

    chart?.subscribe('drawing', (event: any) => {
        if (chart) saveChartLayout(chart);
    });
};

export const drawingEventUnsubscribe = (chart: any) => {
    chart?.unsubscribe('drawing_event', () => {});
};

export const studyEvents = (chart: any) => {
    chart?.subscribe('study_event', (id: any, type: any) => {
        if (chart) saveChartLayout(chart);
    });

    chart?.subscribe('study_properties_changed', () => {
        saveChartLayout(chart);
    });
};

export const studyEventsUnsubscribe = (chart: any) => {
    chart?.unsubscribe('study_event', () => {});
    chart?.unsubscribe('study_properties_changed', () => {});
};

export const intervalChangedSubscribe = (chart: any) => {
    chart
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, (interval: number, timeframeObj: any) => {
            saveChartLayout(chart);
        });
};

export const intervalChangedUnsubscribe = (chart: any) => {
    chart
        .activeChart()
        .onIntervalChanged()
        .unsubscribe(null, (interval: number, timeframeObj: any) => {
            timeframeObj.timeframe = {
                value: '12M',
                type: 'period-back',
            };
            saveChartLayout(chart);
        });
};
