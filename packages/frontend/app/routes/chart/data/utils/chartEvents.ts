import type { IChartingLibraryWidget } from '~/tv/charting_library';
import { saveChartLayout } from './chartStorage';

const drawingHandlers = new Map<IChartingLibraryWidget, () => void>();
const studyEventHandlers = new Map<IChartingLibraryWidget, () => void>();
const studyPropsChangedHandlers = new Map<IChartingLibraryWidget, () => void>();
const intervalChangedHandlers = new Map<IChartingLibraryWidget, () => void>();
const visibleRangeChangedHandlers = new Map<
    IChartingLibraryWidget,
    () => void
>();

export const drawingEvent = (chart: IChartingLibraryWidget) => {
    const handler = () => {
        saveChartLayout(chart);
    };
    drawingHandlers.set(chart, handler);
    chart?.subscribe('drawing_event', handler);
};

export const drawingEventUnsubscribe = (chart: IChartingLibraryWidget) => {
    const handler = drawingHandlers.get(chart);
    if (!handler) return;
    try {
        chart?.unsubscribe('drawing_event', handler);
    } catch (error) {
        console.log(
            '>>> NOOOOOOOOOOOOOOOOOOOOO drawingEventUnsubscribe error',
            error,
        );
        console.error(error);
    } finally {
        drawingHandlers.delete(chart);
    }
};

export const studyEvents = (chart: IChartingLibraryWidget) => {
    const studyHandler = () => {
        saveChartLayout(chart);
    };
    const propsHandler = () => {
        saveChartLayout(chart);
    };

    studyEventHandlers.set(chart, studyHandler);
    studyPropsChangedHandlers.set(chart, propsHandler);

    chart?.subscribe('study_event', studyHandler);
    chart?.subscribe('study_properties_changed', propsHandler);
};

export const studyEventsUnsubscribe = (chart: IChartingLibraryWidget) => {
    const studyHandler = studyEventHandlers.get(chart);
    const propsHandler = studyPropsChangedHandlers.get(chart);

    if (studyHandler) {
        chart?.unsubscribe('study_event', studyHandler);
        studyEventHandlers.delete(chart);
    }

    if (propsHandler) {
        chart?.unsubscribe('study_properties_changed', propsHandler);
        studyPropsChangedHandlers.delete(chart);
    }
};

export const intervalChangedSubscribe = (
    chart: IChartingLibraryWidget,
    setIsChartReady: React.Dispatch<React.SetStateAction<boolean>>,
) => {
    const handler = () => {
        setIsChartReady(false);
        saveChartLayout(chart);
    };

    intervalChangedHandlers.set(chart, handler);

    chart.activeChart().onIntervalChanged().subscribe(null, handler);
};

export const intervalChangedUnsubscribe = (chart: IChartingLibraryWidget) => {
    const handler = intervalChangedHandlers.get(chart);
    if (!handler) return;

    chart.activeChart().onIntervalChanged().unsubscribe(null, handler);

    intervalChangedHandlers.delete(chart);
};

export const visibleRangeChangedSubscribe = (chart: IChartingLibraryWidget) => {
    const handler = () => {
        saveChartLayout(chart);
    };

    visibleRangeChangedHandlers.set(chart, handler);

    chart.activeChart().onVisibleRangeChanged().subscribe(null, handler);
};

export const visibleRangeChangedUnsubscribe = (
    chart: IChartingLibraryWidget,
) => {
    const handler = visibleRangeChangedHandlers.get(chart);
    if (!handler) return;

    chart.activeChart().onVisibleRangeChanged().unsubscribe(null, handler);

    visibleRangeChangedHandlers.delete(chart);
};
