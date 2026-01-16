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
import { FaChevronLeft } from 'react-icons/fa';
import { t } from 'i18next';

export interface textInputIF {
    label: string;
    input: string | string[];
    blurb: string;
}

const inputData = {
    name: {
        label: 'Strategy Name',
        input: 'Name',
        blurb: 'Choose a descriptive name for your trading strategy. This will help you identify and manage your strategies effectively.',
    },
    market: {
        label: 'Market',
        input: ['BTC', 'ETH', 'SOL'],
        blurb: 'Select the market where you want to deploy this trading  strategy. Different markets have varying volatility and liquidity characteristics.',
    },
    distance: {
        label: 'Distance',
        input: 'Distance',
        blurb: 'Define the distance parameter for your strategy. This determines how far from the current price your orders will be placed.',
    },
    distanceType: {
        label: 'Distance Type',
        input: ['Ticks', '%'],
        blurb: 'Choose how the distance is measured. Ticks provide precise control, while percentage offers proportional scaling with price movements.',
    },
    side: {
        label: 'Side',
        input: ['Both', 'Above', 'Below'],
        blurb: 'Specify whether the strategy should place buy orders, sell orders, or  both. "Both" enables market making on both sides of the order book.',
    },
    totalSize: {
        label: 'Total Size',
        input: 'Total Size',
        blurb: 'Set the total amount of capital to allocate to this strategy. This represents the maximum exposure across all active orders.',
    },
    orderSize: {
        label: 'Order Size',
        input: 'Order Size',
        blurb: 'Define the size of individual orders. Smaller orders provide better granularity but may increase transaction costs.',
    },
};

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

export default function CreateStrategy(props: propsT) {
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

    const isValid = useMemo(() => {
        if (!name || name.trim() === '') return false;
        if (!market || market.trim() === '') return false;
        if (!distance || isNaN(Number(distance)) || Number(distance) <= 0)
            return false;
        if (!totalSize || isNaN(Number(totalSize)) || Number(totalSize) <= 0)
            return false;
        if (!orderSize || isNaN(Number(orderSize)) || Number(orderSize) <= 0)
            return false;
        return true;
    }, [name, market, distance, totalSize, orderSize]);

    return (
        <div className={styles.create_strategy_page}>
            <div className={styles.create_strategy}>
                <header>
                    <div
                        onClick={() => {
                            // base URL destination for backnav
                            let destination = '/strategies';
                            // if user is on edit page, add address param to URL
                            if (params.address) {
                                destination += `/${params.address}`;
                            }
                            // navigate user to the correct destination
                            // note that this is a forward nav action
                            navigate(destination);
                        }}
                    >
                        <FaChevronLeft />
                    </div>
                    {page === 'new' && <h2>{t('strategies.newStrategy')}</h2>}
                    {page === 'edit' && <h2>{t('strategies.editStrategy')}</h2>}
                </header>
                <div>
                    <section className={styles.create_strategy_inputs}>
                        <InputText
                            initial={name}
                            data={inputData.name}
                            handleChange={(text: string) => setName(text)}
                        />
                        <InputText
                            initial={market}
                            data={inputData.market}
                            handleChange={(text: string) => setMarket(text)}
                        />
                        <InputText
                            initial={distance}
                            data={inputData.distance}
                            handleChange={(text: string) => setDistance(text)}
                        />
                        <InputText
                            initial={distanceType}
                            data={inputData.distanceType}
                            handleChange={(text: string) =>
                                setDistanceType(text)
                            }
                        />
                        <InputText
                            initial={side}
                            data={inputData.side}
                            handleChange={(text: string) => setSide(text)}
                        />
                        <InputText
                            initial={totalSize}
                            data={inputData.totalSize}
                            handleChange={(text: string) => setTotalSize(text)}
                        />
                        <InputText
                            initial={orderSize}
                            data={inputData.orderSize}
                            handleChange={(text: string) => setOrderSize(text)}
                        />
                    </section>
                    <section className={styles.create_strategy_buttons}>
                        <Button
                            size={100}
                            onClick={() => {
                                console.log(strategy.name);
                                setName(strategy.name);
                                setMarket(strategy.market);
                                setDistance(strategy.distance);
                                setDistanceType(strategy.distanceType);
                                setSide(strategy.side);
                                setTotalSize(strategy.totalSize);
                                setOrderSize(strategy.orderSize);
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
                                            ? `/strategies/${location.state.address}`
                                            : '/strategies',
                                    )
                                }
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={() => {
                                    const values = {
                                        name,
                                        market,
                                        distance,
                                        distanceType,
                                        side,
                                        totalSize,
                                        orderSize,
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
                                    navigate('/strategies');
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
