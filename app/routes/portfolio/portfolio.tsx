import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import type { Route } from '../../+types/root';
import styles from './portfolio.module.css';
// import styles from './portfolio.module.css'
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Perps - Portfolio' },
        { name: 'description', content: 'Welcome to React Router!' },
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return { message: context.VALUE_FROM_NETLIFY };
}

export default function Portfolio({ loaderData }: Route.ComponentProps) {
    return (
        // <Welcome title='Portfolio' />
        <div className={styles.container}>
            <TradeTable initialTab='Balances' />
            {/* <div className={styles.container}>
                <h1>Portfolio</h1>
                <p>Placeholder.</p>
                <button>
                    <a href='/trade'>Go to Trade</a>
                </button>
            </div> */}
        </div>
    );
}
