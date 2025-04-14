
# Perps App Monorepo

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
