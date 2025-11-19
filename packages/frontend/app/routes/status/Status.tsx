import { useEffect, useState, type ReactElement } from 'react';
import { LuRefreshCcw } from 'react-icons/lu';
import styles from './Status.module.css';
import { POLLING_API_INFO_ENDPOINT, RPC_ENDPOINT } from '~/utils/Constants';

type EndpointStatus = {
    name: string;
    url: string;
    status: 'checking' | 'operational' | 'down';
    responseTime?: number;
    lastChecked?: Date;
    error?: string;
    requestDetails?: {
        method: string;
        headers: Record<string, string>;
        body: unknown;
    };
    responseDetails?: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        body: unknown;
    };
};

const MIN_SPIN_TIME = 0.5; // seconds

// JSON syntax highlighter component
const JsonHighlight = ({ data }: { data: unknown }) => {
    const highlightJson = (obj: unknown, indent = 0): ReactElement[] => {
        const elements: ReactElement[] = [];
        const indentStr = '  '.repeat(indent);

        if (obj === null) {
            elements.push(
                <span key={`${indent}-null`} className={styles.json_null}>
                    null
                </span>,
            );
        } else if (typeof obj === 'boolean') {
            elements.push(
                <span key={`${indent}-bool`} className={styles.json_boolean}>
                    {String(obj)}
                </span>,
            );
        } else if (typeof obj === 'number') {
            elements.push(
                <span key={`${indent}-num`} className={styles.json_number}>
                    {obj}
                </span>,
            );
        } else if (typeof obj === 'string') {
            elements.push(
                <span key={`${indent}-str`} className={styles.json_string}>
                    "{obj}"
                </span>,
            );
        } else if (Array.isArray(obj)) {
            elements.push(
                <span
                    key={`${indent}-arr-open`}
                    className={styles.json_punctuation}
                >
                    {'[\n'}
                </span>,
            );
            obj.forEach((item, index) => {
                elements.push(
                    <span key={`${indent}-arr-indent-${index}`}>
                        {indentStr}{' '}
                    </span>,
                );
                elements.push(...highlightJson(item, indent + 1));
                if (index < obj.length - 1) {
                    elements.push(
                        <span
                            key={`${indent}-arr-comma-${index}`}
                            className={styles.json_punctuation}
                        >
                            ,
                        </span>,
                    );
                }
                elements.push(
                    <span key={`${indent}-arr-newline-${index}`}>{'\n'}</span>,
                );
            });
            elements.push(<span key={`${indent}-arr-close`}>{indentStr}</span>);
            elements.push(
                <span
                    key={`${indent}-arr-bracket`}
                    className={styles.json_punctuation}
                >
                    ]
                </span>,
            );
        } else if (typeof obj === 'object') {
            elements.push(
                <span
                    key={`${indent}-obj-open`}
                    className={styles.json_punctuation}
                >
                    {'{\n'}
                </span>,
            );
            const entries = Object.entries(obj);
            entries.forEach(([key, value], index) => {
                elements.push(
                    <span key={`${indent}-obj-indent-${index}`}>
                        {indentStr}{' '}
                    </span>,
                );
                elements.push(
                    <span
                        key={`${indent}-obj-key-${index}`}
                        className={styles.json_key}
                    >
                        "{key}"
                    </span>,
                );
                elements.push(
                    <span
                        key={`${indent}-obj-colon-${index}`}
                        className={styles.json_punctuation}
                    >
                        :{' '}
                    </span>,
                );
                elements.push(...highlightJson(value, indent + 1));
                if (index < entries.length - 1) {
                    elements.push(
                        <span
                            key={`${indent}-obj-comma-${index}`}
                            className={styles.json_punctuation}
                        >
                            ,
                        </span>,
                    );
                }
                elements.push(
                    <span key={`${indent}-obj-newline-${index}`}>{'\n'}</span>,
                );
            });
            elements.push(<span key={`${indent}-obj-close`}>{indentStr}</span>);
            elements.push(
                <span
                    key={`${indent}-obj-brace`}
                    className={styles.json_punctuation}
                >
                    {'}'}
                </span>,
            );
        }

        return elements;
    };

    return <pre className={styles.json_display}>{highlightJson(data)}</pre>;
};

export default function Status() {
    const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
        {
            name: 'Polling API Info Endpoint',
            url: POLLING_API_INFO_ENDPOINT,
            status: 'checking',
        },
        {
            name: 'RPC Endpoint',
            url: RPC_ENDPOINT,
            status: 'checking',
        },
    ]);

    const [expandedAccordions, setExpandedAccordions] = useState<Set<string>>(
        new Set(),
    );

    const toggleAccordion = (key: string) => {
        setExpandedAccordions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const checkEndpoint = async (
        endpoint: EndpointStatus,
    ): Promise<EndpointStatus> => {
        const startTime = performance.now();

        const requestBody = { type: 'meta' };
        const requestHeaders = { 'Content-Type': 'application/json' };
        const requestDetails = {
            method: 'POST',
            headers: requestHeaders,
            body: requestBody,
        };

        try {
            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody),
            });

            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            // Extract response details
            const responseBody = await response.json().catch(() => null);
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            const responseDetails = {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: responseBody,
            };

            if (response.ok) {
                return {
                    ...endpoint,
                    status: 'operational',
                    responseTime,
                    lastChecked: new Date(),
                    requestDetails,
                    responseDetails,
                };
            } else {
                return {
                    ...endpoint,
                    status: 'down',
                    responseTime,
                    lastChecked: new Date(),
                    error: `HTTP ${response.status}`,
                    requestDetails,
                    responseDetails,
                };
            }
        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            return {
                ...endpoint,
                status: 'down',
                responseTime,
                lastChecked: new Date(),
                error: error instanceof Error ? error.message : 'Unknown error',
                requestDetails,
            };
        }
    };

    const checkAllEndpoints = async () => {
        const startTime = performance.now();

        // Set all endpoints to checking first
        setEndpoints((prev) =>
            prev.map((ep) => ({ ...ep, status: 'checking' as const })),
        );

        // Check all endpoints in parallel
        const updatedEndpoints = await Promise.all(
            endpoints.map(checkEndpoint),
        );

        // Ensure minimum spinner duration
        const elapsedTime = performance.now() - startTime;
        const remainingTime = Math.max(0, MIN_SPIN_TIME * 1000 - elapsedTime);

        if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        setEndpoints(updatedEndpoints);
    };

    const checkSingleEndpoint = async (index: number) => {
        const endpoint = endpoints[index];
        const startTime = performance.now();

        // Set status to checking first
        setEndpoints((prev) =>
            prev.map((ep, i) =>
                i === index ? { ...ep, status: 'checking' as const } : ep,
            ),
        );

        // Perform the check
        const updatedEndpoint = await checkEndpoint(endpoint);

        // Ensure minimum spinner duration
        const elapsedTime = performance.now() - startTime;
        const remainingTime = Math.max(0, MIN_SPIN_TIME * 1000 - elapsedTime);

        if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Update with result
        setEndpoints((prev) =>
            prev.map((ep, i) => (i === index ? updatedEndpoint : ep)),
        );
    };

    useEffect(() => {
        checkAllEndpoints();

        // Check every 30 seconds
        const interval = setInterval(checkAllEndpoints, 30000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: EndpointStatus['status']) => {
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
        <div className={styles.status_page}>
            <header className={styles.page_header}>
                <h2 className={styles.title}>System Status</h2>
                <button
                    onClick={checkAllEndpoints}
                    className={styles.refresh_button}
                >
                    Refresh All
                </button>
            </header>

            <div className={styles.endpoints_container}>
                {endpoints.map((endpoint, index) => (
                    <div key={endpoint.url} className={styles.endpoint_card}>
                        <div className={styles.endpoint_header}>
                            <h3 className={styles.endpoint_name}>
                                {endpoint.name}
                            </h3>
                            <div className={styles.header_actions}>
                                <button
                                    onClick={() => checkSingleEndpoint(index)}
                                    className={styles.refresh_icon_button}
                                    title='Refresh this endpoint'
                                    disabled={endpoint.status === 'checking'}
                                >
                                    <LuRefreshCcw
                                        className={
                                            endpoint.status === 'checking'
                                                ? styles.spinning
                                                : ''
                                        }
                                    />
                                </button>
                                <span
                                    className={`${styles.status_badge} ${getStatusColor(endpoint.status)}`}
                                >
                                    {endpoint.status === 'checking'
                                        ? 'Checking...'
                                        : endpoint.status === 'operational'
                                          ? 'Operational'
                                          : 'Down'}
                                </span>
                            </div>
                        </div>

                        {endpoint.status === 'checking' ? (
                            <div className={styles.loading_container}>
                                <LuRefreshCcw
                                    className={styles.loading_spinner}
                                />
                                <span className={styles.loading_text}>
                                    Checking endpoint...
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className={styles.endpoint_details}>
                                    <div className={styles.detail_row}>
                                        <span className={styles.detail_label}>
                                            URL:
                                        </span>
                                        <span className={styles.detail_value}>
                                            {endpoint.url}
                                        </span>
                                    </div>

                                    {endpoint.responseTime !== undefined && (
                                        <div className={styles.detail_row}>
                                            <span
                                                className={styles.detail_label}
                                            >
                                                Response Time:
                                            </span>
                                            <span
                                                className={styles.detail_value}
                                            >
                                                {endpoint.responseTime}ms
                                            </span>
                                        </div>
                                    )}

                                    {endpoint.lastChecked && (
                                        <div className={styles.detail_row}>
                                            <span
                                                className={styles.detail_label}
                                            >
                                                Last Checked:
                                            </span>
                                            <span
                                                className={styles.detail_value}
                                            >
                                                {endpoint.lastChecked.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    )}

                                    {endpoint.error && (
                                        <div className={styles.detail_row}>
                                            <span
                                                className={styles.detail_label}
                                            >
                                                Error:
                                            </span>
                                            <span
                                                className={`${styles.detail_value} ${styles.error_text}`}
                                            >
                                                {endpoint.error}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {(endpoint.requestDetails ||
                                    endpoint.responseDetails) && (
                                    <div className={styles.accordion_container}>
                                        <div
                                            className={styles.accordion_buttons}
                                        >
                                            {endpoint.requestDetails &&
                                                (() => {
                                                    const jsonString =
                                                        JSON.stringify(
                                                            endpoint.requestDetails,
                                                            null,
                                                            2,
                                                        );
                                                    const lineCount =
                                                        jsonString.split(
                                                            '\n',
                                                        ).length;
                                                    return (
                                                        <button
                                                            onClick={() =>
                                                                toggleAccordion(
                                                                    `${index}-request`,
                                                                )
                                                            }
                                                            className={`${styles.accordion_button} ${styles.accordion_button_request} ${
                                                                expandedAccordions.has(
                                                                    `${index}-request`,
                                                                )
                                                                    ? styles.accordion_button_request_expanded
                                                                    : ''
                                                            }`}
                                                        >
                                                            <span
                                                                className={
                                                                    styles.accordion_button_title
                                                                }
                                                            >
                                                                Request Details
                                                            </span>
                                                            <span
                                                                className={
                                                                    styles.accordion_button_subtitle
                                                                }
                                                            >
                                                                ({lineCount}{' '}
                                                                lines)
                                                            </span>
                                                        </button>
                                                    );
                                                })()}
                                            {endpoint.responseDetails &&
                                                (() => {
                                                    const jsonString =
                                                        JSON.stringify(
                                                            endpoint.responseDetails,
                                                            null,
                                                            2,
                                                        );
                                                    const lineCount =
                                                        jsonString.split(
                                                            '\n',
                                                        ).length;
                                                    return (
                                                        <button
                                                            onClick={() =>
                                                                toggleAccordion(
                                                                    `${index}-response`,
                                                                )
                                                            }
                                                            className={`${styles.accordion_button} ${styles.accordion_button_response} ${
                                                                expandedAccordions.has(
                                                                    `${index}-response`,
                                                                )
                                                                    ? styles.accordion_button_response_expanded
                                                                    : ''
                                                            }`}
                                                        >
                                                            <span
                                                                className={
                                                                    styles.accordion_button_title
                                                                }
                                                            >
                                                                Response Details
                                                            </span>
                                                            <span
                                                                className={
                                                                    styles.accordion_button_subtitle
                                                                }
                                                            >
                                                                ({lineCount}{' '}
                                                                lines)
                                                            </span>
                                                        </button>
                                                    );
                                                })()}
                                        </div>
                                        <div
                                            className={
                                                styles.accordion_contents
                                            }
                                        >
                                            {expandedAccordions.has(
                                                `${index}-request`,
                                            ) &&
                                                endpoint.requestDetails && (
                                                    <div
                                                        className={
                                                            styles.accordion_item
                                                        }
                                                    >
                                                        <div
                                                            className={`${styles.accordion_label_text} ${styles.accordion_label_request}`}
                                                        >
                                                            Request Details
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.accordion_content
                                                            }
                                                        >
                                                            <JsonHighlight
                                                                data={
                                                                    endpoint.requestDetails
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            {expandedAccordions.has(
                                                `${index}-response`,
                                            ) &&
                                                endpoint.responseDetails && (
                                                    <div
                                                        className={
                                                            styles.accordion_item
                                                        }
                                                    >
                                                        <div
                                                            className={`${styles.accordion_label_text} ${styles.accordion_label_response}`}
                                                        >
                                                            Response Details
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.accordion_content
                                                            }
                                                        >
                                                            <JsonHighlight
                                                                data={
                                                                    endpoint.responseDetails
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
