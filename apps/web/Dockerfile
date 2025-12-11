FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.7 --activate

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

# Build web
COPY . .
RUN pnpm --filter web build

FROM node:20-alpine
WORKDIR /app
ARG WATCH=false
ENV WATCH=${WATCH}
ENV CHOKIDAR_USEPOLLING=1

COPY --from=base /app /app

WORKDIR /app/apps/web
ENV PORT=3000
EXPOSE 3000

# If WATCH=true, run Next.js dev server with polling for containerized envs.
CMD ["sh", "-c", "if [ \"$WATCH\" = \"true\" ]; then node node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 3000; else node node_modules/next/dist/bin/next start; fi"]
