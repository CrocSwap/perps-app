import { useMemo } from 'react';
import ButtonShowcase from '~/components/Button/ButtonShowcase/ButtonShowcase';
import type { Route } from '../../+types/root';
import styles from './home.module.css';

export function loader({ context }: Route.LoaderArgs) {
    return { message: context.VALUE_FROM_NETLIFY };
}

export default function Home() {
    const title = useMemo(() => `Ambient`, []);

    const ogImage = useMemo(
        () =>
            `https://ogcdn.net/da4a0656-0565-4e39-bf07-21693b0e75f4/v1/BTC%20%2F%20USD/%23000000/Trade%20BTC%20Futures%20on%20Ambient/Trade%20Now/rgba(78%2C%2059%2C%20193%2C%201)/https%3A%2F%2Fopengraph.b-cdn.net%2Fproduction%2Fimages%2Ff4b4ae96-8d00-4542-be9a-aa88baa20b71.png%3Ftoken%3Dr8QAtZP22dg8D9xO49yyukxsP6vMYppjw5a1t-5PE1M%26height%3D500%26width%3D500%26expires%3D33280645642/rgba(82%2C%2071%2C%20179%2C%201)/linear-gradient(120deg%2C%20rgba(255%2C255%2C255%2C1)%2027%25%2C%20RGBA(62%2C%2051%2C%20147%2C%201)%2086%25)/https%3A%2F%2Fopengraph.b-cdn.net%2Fproduction%2Fimages%2F97217047-4d16-43c6-82d9-00def7bf6631.png%3Ftoken%3DpnvvvLULvCnOD2vp4i4ifsuEqIzLf8Q-TyveG-a3eQw%26height%3D510%26width%3D684%26expires%3D33280645584/og.png`,
        [],
    );
    return (
        <>
            <title>{title}</title>
            <meta property='og:image' content={ogImage} />

            <div className={styles.container}>
                <ButtonShowcase />
                <div style={{ padding: '100px' }}></div>
            </div>
        </>
    );
}
