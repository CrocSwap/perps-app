import { Link, Outlet } from 'react-router';
import type { Route } from '../+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.VALUE_FROM_NETLIFY };
}

export default function Market({ loaderData }: Route.ComponentProps) {
  return (
    <div >
      <h2>Trade market</h2>

     
    </div>
  );
}
