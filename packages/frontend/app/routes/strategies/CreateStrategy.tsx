import Button from '~/components/Button/Button';
import styles from './CreateStrategy.module.css';
import InputText from './InputText';
import {
    NEW_STRATEGY_DEFAULTS,
    type strategyIF,
} from '~/stores/StrategiesStore';
import { useLocation, useNavigate, useParams } from 'react-router';
import { type useAccountsIF, useAccounts } from '~/stores/AccountsStore';
import {
    type NotificationStoreIF,
    useNotificationStore,
} from '~/stores/NotificationStore';
import { useState, useMemo } from 'react';
import { LuChevronLeft } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

type strategyFieldKey =
    | 'name'
    | 'market'
    | 'distance'
    | 'distanceType'
    | 'side'
    | 'totalSize'
    | 'orderSize';

export interface strategyOptionIF {
    value: string;
    label: string;
}

export interface textInputIF {
    key: strategyFieldKey;
    label: string;
    input: string | strategyOptionIF[];
    blurb: string;
}

function parseNumericInput(value: string): number {
    const normalized = value
        .replace(/[$,%\s_]/g, '')
        .replace(/,/g, '')
        .trim();
    if (!normalized) return NaN;
    return Number(normalized);
}

interface basePropsIF {
    page: 'new' | 'edit';
}

interface newStrategyPropsIF extends basePropsIF {
    page: 'new';
    submitFn: (s: strategyIF) => void;
}

interface editStrategyPropsIF extends basePropsIF {
    page: 'edit';
    submitFn: (s: strategyIF, addr: string) => void;
}

type propsT = newStrategyPropsIF | editStrategyPropsIF;

const STRATEGIES_BASE_PATH = '/v2/strategies';

export default function CreateStrategy(props: propsT) {
    const { t } = useTranslation();
    const { page, submitFn } = props;
    const navigate = useNavigate();

    const params = useParams();

    // logic to dispatch a notification for sub-account creation
    const notifications: NotificationStoreIF = useNotificationStore();
    // state data for subaccounts
    const subAccounts: useAccountsIF = useAccounts();

    const location = useLocation();
    const strategy: strategyIF = location.state
        ? location.state.strategy
        : NEW_STRATEGY_DEFAULTS;

    const [name, setName] = useState(strategy.name);
    const [market, setMarket] = useState(strategy.market);
    const [distance, setDistance] = useState(strategy.distance);
    const [distanceType, setDistanceType] = useState(strategy.distanceType);
    const [side, setSide] = useState(strategy.side);
    const [totalSize, setTotalSize] = useState(strategy.totalSize);
    const [orderSize, setOrderSize] = useState(strategy.orderSize);

    const [touched, setTouched] = useState<Record<strategyFieldKey, boolean>>({
        name: false,
        market: false,
        distance: false,
        distanceType: false,
        side: false,
        totalSize: false,
        orderSize: false,
    });

    const inputData: Record<strategyFieldKey, textInputIF> = useMemo(
        () => ({
            name: {
                key: 'name',
                label: t('strategies.form.labels.name'),
                input: t('strategies.form.placeholders.name'),
                blurb: t('strategies.form.blurbs.name'),
            },
            market: {
                key: 'market',
                label: t('strategies.form.labels.market'),
                input: [
                    { value: 'BTC', label: 'BTC' },
                    { value: 'ETH', label: 'ETH' },
                    { value: 'SOL', label: 'SOL' },
                ],
                blurb: t('strategies.form.blurbs.market'),
            },
            distance: {
                key: 'distance',
                label: t('strategies.form.labels.distance'),
                input: t('strategies.form.placeholders.distance'),
                blurb: t('strategies.form.blurbs.distance'),
            },
            distanceType: {
                key: 'distanceType',
                label: t('strategies.form.labels.distanceType'),
                input: [
                    {
                        value: 'Ticks',
                        label: t('strategies.form.options.distanceType.ticks'),
                    },
                    {
                        value: '%',
                        label: t(
                            'strategies.form.options.distanceType.percentage',
                        ),
                    },
                ],
                blurb: t('strategies.form.blurbs.distanceType'),
            },
            side: {
                key: 'side',
                label: t('strategies.form.labels.side'),
                input: [
                    {
                        value: 'Both',
                        label: t('strategies.form.options.side.both'),
                    },
                    {
                        value: 'Above',
                        label: t('strategies.form.options.side.above'),
                    },
                    {
                        value: 'Below',
                        label: t('strategies.form.options.side.below'),
                    },
                ],
                blurb: t('strategies.form.blurbs.side'),
            },
            totalSize: {
                key: 'totalSize',
                label: t('strategies.form.labels.totalSize'),
                input: t('strategies.form.placeholders.totalSize'),
                blurb: t('strategies.form.blurbs.totalSize'),
            },
            orderSize: {
                key: 'orderSize',
                label: t('strategies.form.labels.orderSize'),
                input: t('strategies.form.placeholders.orderSize'),
                blurb: t('strategies.form.blurbs.orderSize'),
            },
        }),
        [t],
    );

    const errors = useMemo(() => {
        const nextErrors: Partial<Record<strategyFieldKey, string>> = {};

        if (!name.trim()) {
            nextErrors.name = t('strategies.form.validation.nameRequired');
        }

        if (!market.trim()) {
            nextErrors.market = t('strategies.form.validation.marketRequired');
        }

        const parsedDistance = parseNumericInput(distance);
        if (!distance.trim()) {
            nextErrors.distance = t(
                'strategies.form.validation.distanceRequired',
            );
        } else if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
            nextErrors.distance = t(
                'strategies.form.validation.positiveNumber',
            );
        }

        if (!distanceType.trim()) {
            nextErrors.distanceType = t(
                'strategies.form.validation.distanceTypeRequired',
            );
        }

        if (!side.trim()) {
            nextErrors.side = t('strategies.form.validation.sideRequired');
        }

        const parsedTotalSize = parseNumericInput(totalSize);
        if (!totalSize.trim()) {
            nextErrors.totalSize = t(
                'strategies.form.validation.totalSizeRequired',
            );
        } else if (Number.isNaN(parsedTotalSize) || parsedTotalSize <= 0) {
            nextErrors.totalSize = t(
                'strategies.form.validation.positiveNumber',
            );
        }

        const parsedOrderSize = parseNumericInput(orderSize);
        if (!orderSize.trim()) {
            nextErrors.orderSize = t(
                'strategies.form.validation.orderSizeRequired',
            );
        } else if (Number.isNaN(parsedOrderSize) || parsedOrderSize <= 0) {
            nextErrors.orderSize = t(
                'strategies.form.validation.positiveNumber',
            );
        } else if (
            !Number.isNaN(parsedTotalSize) &&
            parsedTotalSize > 0 &&
            parsedOrderSize > parsedTotalSize
        ) {
            nextErrors.orderSize = t(
                'strategies.form.validation.orderSizeExceedsTotal',
            );
        }

        return nextErrors;
    }, [distance, distanceType, market, name, orderSize, side, t, totalSize]);

    const isValid = useMemo(() => {
        return Object.keys(errors).length === 0;
    }, [errors]);

    const setFieldTouched = (field: strategyFieldKey) => {
        setTouched((prev) => ({
            ...prev,
            [field]: true,
        }));
    };

    const markAllTouched = () => {
        setTouched({
            name: true,
            market: true,
            distance: true,
            distanceType: true,
            side: true,
            totalSize: true,
            orderSize: true,
        });
    };

    return (
        <div className={styles.create_strategy_page}>
            <div className={styles.create_strategy}>
                <header>
                    <div className={styles.heading_row}>
                        <button
                            type='button'
                            onClick={() => {
                                // base URL destination for backnav
                                let destination = STRATEGIES_BASE_PATH;
                                // if user is on edit page, add address param to URL
                                if (params.strategy_hash) {
                                    destination += `/${params.strategy_hash}`;
                                }
                                // navigate user to the correct destination
                                // note that this is a forward nav action
                                navigate(destination);
                            }}
                            className={styles.back_button}
                        >
                            <LuChevronLeft />
                        </button>
                        {page === 'new' && (
                            <h2>{t('strategies.newStrategy')}</h2>
                        )}
                        {page === 'edit' && (
                            <h2>{t('strategies.editStrategy')}</h2>
                        )}
                    </div>
                </header>
                <div>
                    <section className={styles.create_strategy_inputs}>
                        <InputText
                            initial={name}
                            data={inputData.name}
                            handleChange={(text: string) => setName(text)}
                            onBlur={() => setFieldTouched('name')}
                            error={touched.name ? errors.name : undefined}
                        />
                        <InputText
                            initial={market}
                            data={inputData.market}
                            handleChange={(text: string) => setMarket(text)}
                            onBlur={() => setFieldTouched('market')}
                            error={touched.market ? errors.market : undefined}
                        />
                        <InputText
                            initial={distance}
                            data={inputData.distance}
                            handleChange={(text: string) => setDistance(text)}
                            onBlur={() => setFieldTouched('distance')}
                            error={
                                touched.distance ? errors.distance : undefined
                            }
                        />
                        <InputText
                            initial={distanceType}
                            data={inputData.distanceType}
                            handleChange={(text: string) =>
                                setDistanceType(text)
                            }
                            onBlur={() => setFieldTouched('distanceType')}
                            error={
                                touched.distanceType
                                    ? errors.distanceType
                                    : undefined
                            }
                        />
                        <InputText
                            initial={side}
                            data={inputData.side}
                            handleChange={(text: string) => setSide(text)}
                            onBlur={() => setFieldTouched('side')}
                            error={touched.side ? errors.side : undefined}
                        />
                        <InputText
                            initial={totalSize}
                            data={inputData.totalSize}
                            handleChange={(text: string) => setTotalSize(text)}
                            onBlur={() => setFieldTouched('totalSize')}
                            error={
                                touched.totalSize ? errors.totalSize : undefined
                            }
                        />
                        <InputText
                            initial={orderSize}
                            data={inputData.orderSize}
                            handleChange={(text: string) => setOrderSize(text)}
                            onBlur={() => setFieldTouched('orderSize')}
                            error={
                                touched.orderSize ? errors.orderSize : undefined
                            }
                        />
                    </section>
                    <section className={styles.create_strategy_buttons}>
                        <Button
                            size={100}
                            onClick={() => {
                                setName(strategy.name);
                                setMarket(strategy.market);
                                setDistance(strategy.distance);
                                setDistanceType(strategy.distanceType);
                                setSide(strategy.side);
                                setTotalSize(strategy.totalSize);
                                setOrderSize(strategy.orderSize);
                                setTouched({
                                    name: false,
                                    market: false,
                                    distance: false,
                                    distanceType: false,
                                    side: false,
                                    totalSize: false,
                                    orderSize: false,
                                });
                            }}
                        >
                            {t('common.reset')}
                        </Button>
                        <div className={styles.buttons_right}>
                            <Button
                                size={100}
                                onClick={() =>
                                    navigate(
                                        location.state
                                            ? `${STRATEGIES_BASE_PATH}/${location.state.address}`
                                            : STRATEGIES_BASE_PATH,
                                    )
                                }
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (!isValid) {
                                        markAllTouched();
                                        return;
                                    }

                                    const values = {
                                        name: name.trim(),
                                        market,
                                        distance: distance.trim(),
                                        distanceType,
                                        side,
                                        totalSize: totalSize.trim(),
                                        orderSize: orderSize.trim(),
                                        isPaused: false,
                                    };
                                    if (page === 'edit' && location.state) {
                                        (
                                            submitFn as (
                                                s: strategyIF,
                                                addr: string,
                                            ) => void
                                        )(values, location.state.address);
                                    } else if (page === 'new') {
                                        (submitFn as (s: strategyIF) => void)(
                                            values,
                                        );
                                        subAccounts.create(name, 'strategy');
                                        notifications.add({
                                            title: t(
                                                'subaccounts.created.title',
                                            ),
                                            message: t(
                                                'subaccounts.created.message',
                                                { name },
                                            ),
                                            icon: 'check',
                                        });
                                    }
                                    navigate(STRATEGIES_BASE_PATH);
                                }}
                                size={100}
                                selected
                                disabled={!isValid}
                            >
                                {page === 'new' && t('common.create')}
                                {page === 'edit' && t('common.update')}
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
