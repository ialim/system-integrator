FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.7 --activate

# Install workspace deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

# Production build stage
FROM base AS prod-build
COPY . .
RUN pnpm --filter web build

# Production runtime
FROM node:20-alpine AS prod
WORKDIR /app
COPY --from=prod-build /app/node_modules ./node_modules
COPY --from=prod-build /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=prod-build /app/apps/web/.next ./apps/web/.next
COPY --from=prod-build /app/apps/web/public ./apps/web/public
COPY --from=prod-build /app/apps/web/package.json ./apps/web/package.json
WORKDIR /app/apps/web
ENV PORT=3000
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]

# Development target (use with compose override)
FROM base AS dev
WORKDIR /app
COPY . .
WORKDIR /app/apps/web
ENV PORT=3000
ENV CHOKIDAR_USEPOLLING=1
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
