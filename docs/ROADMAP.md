# Roadmap

This roadmap captures the planned work from the current codebase, grouped into phases.

## Phase 0 - Foundation hardening
- [x] Require JWT_SECRET outside development and validate core env vars.
- [x] Add request IDs and structured HTTP logs.
- [x] Document a single command for DB setup (`pnpm db:setup`).
- [x] Add global web error and not-found UI.
- [x] Fix non-ASCII UI placeholders for consistent rendering.

## Phase 1 - Catalog and search
- [x] Faceted search, pagination, and sorting.
- [x] Product images and media support.
- [x] Variant comparison and family browsing UX.
- [x] Import validation and dedupe rules.

## Phase 2 - Projects and BOM
- [x] Project CRUD (rename, delete, archive).
- [x] Room CRUD (create, rename, delete).
- [x] Line item edits (notes, qty, pricing override).
- [x] Pricing engine (tiered discounts, volume breaks).
- [x] BOM totals (subtotal, tax, shipping, margin).

## Phase 3 - Quotes and orders
- [x] Quote or PO export (PDF or CSV).
- [x] Order lifecycle status and tracking.
- [x] Snapshot history UI and diff view.
- [x] Client share links.

## Phase 4 - Org and auth
- [x] User invites and role management.
- [x] Password reset and email verification.
- [x] Refresh tokens and logout flow.
- [x] Optional SSO and 2FA.

## Phase 5 - Integrations and ops
- [x] Supplier inventory and lead time sync.
- [x] Shipping and tax estimation.
- [x] Payment gateway integration (Paystack first).
- [x] Background jobs and webhooks.
