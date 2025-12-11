# Architecture & Stack

## Overview
- Monorepo with `pnpm` workspaces.
- Frontend: Next.js (App Router), React, TypeScript, server components for data fetch; ISR for catalog pages; PDF/Excel export via API routes.
- Backend: NestJS (TypeScript) with REST; background jobs via BullMQ; configuration via environment + SSM/Secrets Manager.
- Data: PostgreSQL (primary), Redis (cache/sessions/rate limit), S3 (PDFs/exports/uploads).
- Infra: AWS (ECS/Fargate initially), RDS Postgres, ElastiCache Redis, S3, CloudFront + ALB; Terraform for IaC. Self-host path: Docker Compose (api, web, Postgres, Redis, MinIO, worker) with Traefik/NGINX; or K8s manifests/Helm.
- Auth: JWT access + refresh tokens; optional Google SSO; org-scoped RBAC.
- Observability: OpenTelemetry traces, structured JSON logs, metrics via CloudWatch/Prometheus, error tracking (Sentry).
- Regional focus: Africa-first rollout with payments via Paystack/Flutterwave (Interswitch optional), VAT tables by country (no Avalara/TaxJar coverage), shipping via local courier rate tables or EasyPost where supported.

## Service Boundaries
- `catalog`: products, categories, specs, compatibility, bundles/kits, lead-times, stock cache.
- `projects`: projects, rooms/zones, line items, BOM versions, accessories/bundle expansion.
- `pricing`: pricing rules, tiers, volume breaks, promos; quote totalizer (tax/shipping estimators).
- `orders`: quotes/POs, status, tracking, documents.
- `auth/orgs`: orgs, users, roles, invitations, sessions, 2FA.

## API (initial endpoints)
- Auth: sign-in/up, refresh, password reset, SSO callback, org invite/accept.
- Orgs/Users: list/update org, roles (owner/estimator/tech), profile.
- Catalog: list/filter/search products, product detail, compatibility/accessories, lead-time/stock.
- Projects: CRUD projects; rooms/zones; line items (add/update/remove), bundles; notes.
- BOM Versions: snapshot, list versions, restore.
- Pricing: price quote endpoint (returns breakdown, discounts, taxes/shipping estimates).
- Orders: create quote/PO from BOM version; list orders; upload PO; status updates; tracking.

## Data Model (condensed)
- Org {id, name, pricing_tier, tax_status, payment_terms}
- User {id, org_id, email, role, name, auth_provider, mfa_enabled}
- Product {id, sku, category, brand, specs_json, compat, unit_cost, msrp, price_tiers[], lead_time, stock_band, accessories[], bundles[]}
- Project {id, org_id, name, client_meta, status}
- Room {id, project_id, name, notes}
- LineItem {id, project_id, room_id?, product_id, qty, unit_price, discounts[], notes}
- BOMVersion {id, project_id, snapshot_json, totals_json, created_by, created_at}
- Order {id, project_id, bom_version_id, shipping, tax, total, status, tracking[]}

## Pricing Logic (MVP)
- Input: org_id, product_ids+qty, optional promos, destination address, shipping preference.
- Rules: base cost, org tier discount (by brand/category), volume breaks, promos; optional margin view.
- Outputs: line totals, taxes, shipping estimate, lead-time band, blockers (if incompatible/OOS).

## Non-Functional
- Security: org-scoped access checks; least-privilege API keys; signed URLs for docs; audit logs on pricing/BOM/order actions.
- Performance: cache catalog reads; rate limit by IP+org; paginate search; async tasks for PDF generation/email.
- Reliability: daily backups for Postgres; migrations via Prisma/TypeORM; health checks + readiness for ECS.
