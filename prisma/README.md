# Prisma Schema

- Schema defines Org, User (with roles), and Product (mapped to existing columns).
- Uses Postgres (`DATABASE_URL`).
- Client generation: `pnpm prisma:generate`.

## Migrations
- Still using SQL migrations in `apps/api/migrations`. Run with `pnpm --filter api migrate`.
- As we expand schema, we can move to Prisma Migrate or keep raw SQL for now.
