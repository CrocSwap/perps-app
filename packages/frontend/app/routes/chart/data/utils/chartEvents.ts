import type { IChartingLibraryWidget } from '~/tv/charting_library';
import { saveChartLayout } from './chartStorage';

export const drawingEvent = (chart: IChartingLibraryWidget) => {
    chart?.subscribe('drawing_event', () => {
        saveChartLayout(chart);
    });
};

export const drawingEventUnsubscribe = (chart: IChartingLibraryWidget) => {
    try {
        chart?.unsubscribe('drawing_event', () => {});
    } catch (error) {
        console.log(
            '>>> NOOOOOOOOOOOOOOOOOOOOO drawingEventUnsubscribe error',
            error,
        );
        console.error(error);
    }
};

export const studyEvents = (chart: IChartingLibraryWidget) => {
    chart?.subscribe('study_event', () => {
        saveChartLayout(chart);
    });

    chart?.subscribe('study_properties_changed', () => {
        saveChartLayout(chart);
    });
};

export const studyEventsUnsubscribe = (chart: IChartingLibraryWidget) => {
    chart?.unsubscribe('study_event', () => {});
    chart?.unsubscribe('study_properties_changed', () => {});
};

export const intervalChangedSubscribe = (
    chart: IChartingLibraryWidget,
    setIsChartReady: React.Dispatch<React.SetStateAction<boolean>>,
) => {
    chart
        .activeChart()
        .onIntervalChanged()
        .subscribe(null, () => {
            setIsChartReady(false);
            saveChartLayout(chart);
        });
};

export const intervalChangedUnsubscribe = (chart: IChartingLibraryWidget) => {
    chart
        .activeChart()
        .onIntervalChanged()
        .unsubscribe(null, () => {
            (timeframeObj.timeframe = {
                value: '12M',
                type: 'period-back',
            }),
                saveChartLayout(chart);
        });
};

export const visibleRangeChangedSubscribe = (chart: IChartingLibraryWidget) => {
    chart
        .activeChart()
        .onVisibleRangeChanged()
        .subscribe(null, () => {
            saveChartLayout(chart);
        });
};

export const visibleRangeChangedUnsubscribe = (
    chart: IChartingLibraryWidget,
) => {
    chart
        .activeChart()
        .onVisibleRangeChanged()
        .unsubscribe(null, () => {
            saveChartLayout(chart);
        });
};
