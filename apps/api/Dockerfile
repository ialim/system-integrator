FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.7 --activate
RUN apk add --no-cache openssl

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm prisma:generate
RUN pnpm --filter api build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=base /app/apps/api/dist ./apps/api/dist
WORKDIR /app
ENV PORT=3001
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
