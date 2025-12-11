FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# Install dependencies
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile || pnpm install

# Build
COPY . .
RUN pnpm --filter api build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/dist ./apps/api/dist
ENV PORT=3001
EXPOSE 3001
CMD ["pnpm", "--filter", "api", "start"]
