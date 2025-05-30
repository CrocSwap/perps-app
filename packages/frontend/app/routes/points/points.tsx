import Welcome from '~/components/Welcome/Welcome';
export function meta() {
    return [
        { title: 'Points | Ambient' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

export default function Points() {
    return <Welcome title='Points' />;
}
