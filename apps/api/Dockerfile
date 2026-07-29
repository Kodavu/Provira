# Dev-oriented image for the Tally API. Uses pnpm workspaces; the whole repo is
# the build context so workspace packages resolve.
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# Install deps against the full workspace manifest set.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/integrations/package.json packages/integrations/package.json
COPY packages/i18n/package.json packages/i18n/package.json
RUN pnpm install --frozen-lockfile || pnpm install

# Copy sources and generate the Prisma client.
COPY . .
RUN pnpm --filter @tally/db generate

EXPOSE 4000
# entrypoint runs migrations + seed then starts the API in watch mode (see compose).
CMD ["pnpm", "--filter", "@tally/api", "dev"]
