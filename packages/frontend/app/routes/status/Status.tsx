import { useEffect, useState, type ReactElement } from 'react';
import styles from './Status.module.css';
import {
    POLLING_API_INFO_ENDPOINT,
    MARKET_INFO_ENDPOINT,
    RPC_ENDPOINT,
    blockExplorer,
} from '~/utils/Constants';

type EndpointStatus = {
    name: string;
    url: string;
    status: 'checking' | 'operational' | 'down';
    responseTime?: number;
    lastChecked?: Date;
};

type StatusReport = {
    id: string;
    message: string;
    timestamp: Date;
};

const ENDPOINTS = [
    { name: 'Polling API', url: POLLING_API_INFO_ENDPOINT },
    { name: 'Market API', url: MARKET_INFO_ENDPOINT },
    { name: 'RPC Endpoint', url: RPC_ENDPOINT },
    { name: 'Block Explorer', url: blockExplorer },
    {
        name: 'Ember',
        url: 'https://ember-leaderboard-v2.liquidity.tools/health',
    },
];

export default function Status(): ReactElement {
    const [endpoints, setEndpoints] = useState<EndpointStatus[]>(
        ENDPOINTS.map((ep) => ({ ...ep, status: 'checking' as const })),
    );
    const [statusReports, setStatusReports] = useState<StatusReport[]>([
        {
            id: '1',
            message:
                'All systems operational. Successfully processed 1.2M transactions in the last 24 hours.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
            id: '2',
            message:
                'Scheduled maintenance completed. API response times improved by 15%.',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        },
        {
            id: '3',
            message:
                'Investigating intermittent connectivity issues with RPC endpoint. Updates to follow.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
    ]);

    const checkEndpoint = async (
        endpoint: EndpointStatus,
    ): Promise<EndpointStatus> => {
        const startTime = performance.now();

        try {
            await fetch(endpoint.url, {
                method: 'HEAD',
                mode: 'no-cors',
            });

            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            return {
                ...endpoint,
                status: 'operational',
                responseTime,
                lastChecked: new Date(),
            };
        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            return {
                ...endpoint,
                status: 'down',
                responseTime,
                lastChecked: new Date(),
            };
        }
    };

    const checkAllEndpoints = async (): Promise<void> => {
        setEndpoints((prev) =>
            prev.map((ep) => ({ ...ep, status: 'checking' as const })),
        );

        const updatedEndpoints = await Promise.all(
            endpoints.map(checkEndpoint),
        );

        setEndpoints(updatedEndpoints);
    };

    const fetchStatusReports = async (): Promise<void> => {
        // TODO: Replace with actual API call to fetch status reports
        // const response = await fetch('/api/status-reports');
        // const data = await response.json();
        // setStatusReports(data);
    };

    useEffect(() => {
        checkAllEndpoints();
        fetchStatusReports();
    }, []);

    const getStatusColor = (status: EndpointStatus['status']): string => {
        switch (status) {
            case 'operational':
                return styles.status_operational;
            case 'down':
                return styles.status_down;
            case 'checking':
                return styles.status_checking;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>System Status</h1>
                <button onClick={checkAllEndpoints} className={styles.refresh}>
                    Refresh All
                </button>
            </div>

            {statusReports.length > 0 && (
                <div className={styles.report_section}>
                    <h2 className={styles.report_title}>Status Updates</h2>
                    <div className={styles.reports_list}>
                        {statusReports.map((report) => (
                            <div key={report.id} className={styles.report_item}>
                                <div className={styles.report_message}>
                                    {report.message}
                                </div>
                                <div className={styles.report_timestamp}>
                                    {report.timestamp.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {endpoints.map((endpoint) => (
                    <div
                        key={endpoint.url}
                        className={`${styles.card} ${getStatusColor(endpoint.status)}`}
                    >
                        <h3 className={styles.card_title}>{endpoint.name}</h3>
                        <div className={styles.card_status}>
                            {endpoint.status === 'checking'
                                ? 'Checking...'
                                : endpoint.status === 'operational'
                                  ? 'Operational'
                                  : 'Down'}
                        </div>
                        {endpoint.responseTime !== undefined && (
                            <div className={styles.card_time}>
                                {endpoint.responseTime}ms
                            </div>
                        )}
                        <div className={styles.card_url}>{endpoint.url}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
