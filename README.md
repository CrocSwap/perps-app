# Perps App Monorepo

## Run App Locally with Docker (in case the Ambient Perps Website is down)

1. Install Docker Desktop (https://www.docker.com/get-started/)
2. Open the Terminal within Docker Desktop (in the bottom right corner)
3. Run `docker run -p 4003:3002 -e HOST_PORT=4003 crocswap/ambient-perps-frontend`
4. Wait until terminal displays `Production server running at http://localhost:4003` (this could take a few minutes)
5. Open http://localhost:4003 in your browser

### Note: the chart on the trade page will not be available when running in Docker

## Getting Started as a Developer on a Local Instance

1. Make sure you have pnpm package manager installed
2. Run `git submodule update --init --recursive` to update
3. **NOTE:** You'll need to request access from the team if you need access to the TradingView advanced charting library
4. Run `pnpm dev` to launch a local host

## Setup

```bash
pnpm install
pnpm prepare
pnpm update-submodules
```

## Develop Frontend

```bash
cd packages/frontend
pnpm dev
```

## Develop Frontend Shortcut (setup and run from root directory)

```bash
pnpm dev
```

## Troubleshooting (if app/tv submodule directory not getting populated)

```bash
git submodule update --init --recursive
```

## Start Frontend in Production Mode

```bash
cd packages/frontend
pnpm build
pnpm start
```

## Using the SDK in the Frontend

```ts
import { Info } from '@perps-app/sdk';

const info = new Info();
```

Please refer to the [examples](./packages/sdk/examples) in the sdk package for more usage examples.
