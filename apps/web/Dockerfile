FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# Install dependencies
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile || pnpm install

# Build web
COPY . .
RUN pnpm --filter web build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/web/.next ./apps/web/.next
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/package.json ./apps/web/package.json
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
