// this file is necessary due to the way `pnpm` treats CommonJS modules
// always import Helmet and HelmetProvider components from this file

import pkg from 'react-helmet-async';
export const { Helmet, HelmetProvider } = pkg;