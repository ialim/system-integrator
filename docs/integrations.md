# Integrations (Africa-first)

## Payments
- Paystack (primary): Nigeria/Ghana/South Africa; cards, bank transfers, USSD; strong local settlement.
- Flutterwave (secondary): broader Africa coverage (NG, GH, KE, UG, ZA, etc.), cards/mobile money/bank; payouts.
- Interswitch (optional): Nigeria cards/Quickteller/Verve.
- Stripe (optional fallback): only where available; keep adapter-based gateway layer so regions can switch.
- Plan: gateway abstraction with feature flags per org/region; store webhook secrets/keys per org.

## Tax
- Approach: built-in VAT tables per country (config-driven) with periodic updates; per-org tax-exempt flag; simple invoice numbering.
- No Avalara/TaxJar coverage in-region, so provide manual rates + overrides; allow CSV import of tax rates.
- Future: country-specific e-invoicing if required (not in MVP).

## Shipping
- Start with table-based shipping by country/weight/volume and free-pickup option; configurable per org.
- EasyPost only where carriers are supported; otherwise integrate directly with local couriers (DHL, Aramex, GIG, Kwik, etc.) in a later phase.

## Notifications
- Email: SES (cloud) or SMTP (self-host).
- SMS/WhatsApp (optional later): Africa’s Talking/Twilio alternatives based on country.

## Inventory/Lead Time
- Supplier API if provided; otherwise scheduled CSV ingestion (see `docs/supplier-intake.md`) to refresh stock/lead-time and pricing tiers.
