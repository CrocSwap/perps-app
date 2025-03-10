import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from 'react-router';
import type { Route } from './+types/root';
import PageHeader from './components/PageHeader/PageHeader';
import './css/app.css';
import './css/index.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <script src="tv/datafeeds/udf/dist/bundle.js"></script>
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Layout>
      <div className='root-container'>
        <header className='header'>
          <PageHeader/>
        </header>

        <main className='content'>
          <Outlet />
        </main>

       
      </div>
    </Layout>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
      <main className='content error-boundary'>
        <h1>{message}</h1>
        <p>{details}</p>
        {stack && (
          <pre>
            <code>{stack}</code>
          </pre>
        )}
      </main>
  );
}
