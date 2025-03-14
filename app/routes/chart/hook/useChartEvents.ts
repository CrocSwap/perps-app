import { useEffect } from 'react';
import { saveChartLayout } from '../data/utils/chartStorage';

export const useChartEvents = (chart: any) => {
    const drawingEvent = () => {
        chart.subscribe('drawing_event', (id: any, type: any) => {
            saveChartLayout(chart);
        });
    };

    const drawingEventUnsubscribe = () => {
        chart.unsubscribe('drawing_event');
    };

    const studyEvents = () => {
        chart.subscribe('study_event', (id: any, type: any) => {
            saveChartLayout(chart);
        });

        chart.subscribe('study_properties_changed', (id: any, type: any) => {
            saveChartLayout(chart);
        });
    };

    const studyEventsUnsubscribe = () => {
        chart.unsubscribe('study_event');
        chart.unsubscribe('study_properties_changed');
    };

    useEffect(() => {
        if (!chart) return;
        drawingEvent();
        studyEvents();

        return () => {
            drawingEventUnsubscribe();
            studyEventsUnsubscribe();
        };
    }, [chart]);
};
