import Button from '~/components/Button/Button';
import styles from './CreateStrategy.module.css';
import InputText from './InputText';
import type { strategyIF } from '~/stores/StrategiesStore';
import { useLocation, useNavigate } from 'react-router';
import { type useAccountsIF, useAccounts } from '~/stores/AccountsStore';
import {
    type NotificationStoreIF,
    useNotificationStore,
} from '~/stores/NotificationStore';
import { useState } from 'react';

export interface textInputIF {
    label: string;
    input: string|string[];
    blurb: string;
};

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
        blurb: 'Choose how the distance is measured. Ticks provide precise control, while percentage offers proportional scaling with price movements.'
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

export default function CreateStrategy(props: propsT) {
    const { page, submitFn } = props;
    const navigate = useNavigate();

    // TODO:    write a function to validate inputs on change and
    // TODO:    ... and enable disable the CTA accordingly

    // logic to dispatch a notification for sub-account creation
    const notifications: NotificationStoreIF = useNotificationStore();
    // state data for subaccounts
    const subAccounts: useAccountsIF = useAccounts();

    const { strategy, address } = useLocation().state;

    const [name, setName] = useState(strategy.name);
    const [market, setMarket] = useState(strategy.market);
    const [distance, setDistance] = useState(strategy.distance);
    const [distanceType, setDistanceType] = useState(strategy.distanceType);
    const [side, setSide] = useState(strategy.side);
    const [totalSize, setTotalSize] = useState(strategy.totalSize);
    const [orderSize, setOrderSize] = useState(strategy.orderSize);

    return (
        <div className={styles.create_strategy_page}>
            { page === 'new' && <h2>New Strategy</h2> }
            { page === 'edit' && <h2>Edit Strategy: {strategy.name}</h2> }
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
                    handleChange={(text: string) => setDistanceType(text)}
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
                    onClick={() => console.log('RESET FORM')}
                >
                    Reset
                </Button>
                <div className={styles.buttons_right}>
                    <Button
                        size={100}
                        onClick={() => navigate('/strategies')}
                    >
                        Cancel
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
                                orderSize
                            };
                            if (page === 'edit' && address) {
                                (submitFn as (s: strategyIF, addr: string) => void)(values, address);
                            } else if (page === 'new') {
                                (submitFn as (s: strategyIF) => void)(values);
                            }
                            subAccounts.create(name);
                            notifications.add({
                                title: 'Sub Account Created',
                                message: `Made new Sub-Account ${name}`,
                                icon: 'check',
                            });
                            navigate('/strategies');
                        }}
                        size={100}
                        selected
                    >
                        Create
                    </Button>
                </div>
            </section>
        </div>
    );
}
