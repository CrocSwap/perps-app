import Welcome from '~/components/Welcome/Welcome';
import type { Route } from '../../+types/root';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import styles from './portfolio.module.css'
import PositionsTable from '~/components/Trade/PositionsTable/PositionsTable';
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
  

    <TradeTable initialTab="Balances" />
    </div>

  );
}
