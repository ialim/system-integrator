# Smart Integrator Wholesale Platform

Platform for system integrators to design smart-home projects using your product catalog, get instant cost estimates, and place orders/quotes through you.

## Current Direction (assumptions)
- Stack: Next.js (App Router) + React + TypeScript frontend; NestJS (Node/TS) backend; PostgreSQL; Redis for cache/sessions; storage for PDFs/exports; all in a monorepo (pnpm workspaces).
- Hosting: AWS (ECS/Fargate or EKS later), RDS Postgres, ElastiCache Redis, S3 for documents, SES for email. Self-host option via Docker Compose (API, web, Postgres, Redis, object storage like MinIO) or Kubernetes.
- Auth: Org-based accounts with roles (owner, estimator, tech), email/password + optional Google SSO; JWT access + refresh tokens; 2FA optional.
- Integrations (initial): inventory/lead time via supplier API (to be picked), tax via simple VAT tables by country (Africa-focused; Avalara/TaxJar optional later), shipping via rate tables or EasyPost (if supported), payments via Paystack first (Flutterwave optional), Stripe optional later where available.
- MVP scope: catalog browse/search, project/room BOM builder with compatibility suggestions, live pricing/lead-time, tiered discounts, BOM versioning, quote/PO export, org/role management, audit trail for BOM versions and pricing changes.

## Repo Layout (planned)
- `apps/web`: Next.js frontend (estimator workspace, catalog, project builder, checkout/PO).
- `apps/api`: NestJS backend (REST, auth, pricing, BOMs, orders).
- `packages/ui`: shared UI kit/theme tokens.
- `packages/types`: shared TypeScript contracts (DTOs, API clients).
- `packages/config`: lint/tsconfig/tooling.
- `infra/`: IaC (Terraform) and deployment manifests.
- `docs/`: architecture, data model, flows.
- `sample-data/`: catalog template and seed data.

## Immediate Next Steps
1) Supplier data: structured CSVs using `docs/supplier-intake.md` (see `sample-data/supplier-*.csv` as examples).
2) Payments: Paystack first; enable Flutterwave later behind the gateway abstraction.
3) Shipping/tax: confirm any local courier APIs; otherwise we'll use rate tables + VAT tables.
4) Run locally: `cp .env.example .env`, then `docker compose up --build`, then `pnpm db:setup` (web at 3000, api at 3001, Postgres 5432, Redis 6379, MinIO 9000/9001).
5) Roadmap: see `docs/ROADMAP.md` for the phased plan and status.

## How to Use (planned)
- Frontend consumes REST API; all calls scoped by org. A lightweight public catalog read endpoint can be added later.
- Pricing: base cost + tiered discounts per org/brand/category + volume breaks; promo/adjustments; taxes/shipping estimators.
- BOM: rooms/zones, accessory rules, bundles/kits; versioned snapshots locked before quote/PO.
- Orders: quote PDF/Excel export, PO submission, status + tracking updates, audit log.
