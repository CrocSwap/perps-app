FROM node:25.0

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install -g pnpm

ENV NODE_OPTIONS="--max-old-space-size=4096"

CMD ["sh", "-c", "rm -rf /app/* /app/.* 2>/dev/null || true && git clone -b main https://github.com/Crocswap/perps-app.git . && pnpm install && pnpm --filter frontend prod"]

