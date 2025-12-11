# Data Model (MVP detail)

## Org & Users
- Org: id, name, pricing_tier, tax_status (taxable/exempt), payment_terms, default_shipping_pref.
- User: id, org_id, email, name, role (owner/estimator/tech), auth_provider, mfa_enabled, invited_by, last_login.
- OrgPricingTier: id, org_id, brand/category, base_discount, volume_breaks[].

## Catalog
- Product: id, sku, name, brand, category, description, specs_json, unit_cost, currency, msrp, price_tiers[], lead_time_days, stock_band (in-stock/limited/low/backorder), image_url, datasheet_url.
- Compatibility: requires[] (product ids), blocks[] (product ids), recommends[].
- Accessories: accessory product ids.
- Bundles/Kits: bundle id, components [{product_id, qty, optional}], bundle pricing rule.

## Projects & BOM
- Project: id, org_id, name, client_meta (name/site/address), status (draft/quoted/ordered), created_by.
- Room/Zone: id, project_id, name, notes.
- LineItem: id, project_id, room_id?, product_id, qty, unit_price, discounts[], notes, source (bundle/manual/accessory), overridden_unit_price?.
- BOMVersion: id, project_id, snapshot_json (line items + totals), totals_json (subtotal, discounts, tax, shipping, total, lead_time_band), created_by, created_at, comment.

## Orders/Quotes
- Order: id, project_id, bom_version_id, type (quote/po), status (draft/sent/accepted/fulfilled/shipped/cancelled), shipping_address, shipping_cost, tax_amount, total_amount, tracking[], documents[].
- Document: id, order_id, type (quote_pdf/po_upload), storage_url, created_by.

## Audit/Logs
- AuditLog: id, org_id, actor_id, action, resource_type, resource_id, metadata_json, created_at.

## Pricing Parameters
- Tax: destination address -> tax provider (Avalara/TaxJar) response; tax_exempt flag on org.
- Shipping: weight/volume by product -> carrier rates (EasyPost) or flat tables.
- Discounts: org tier, brand/category, volume breaks, promos.
- FX (optional): currency conversion per org/quote if FX rates configured; otherwise show supplier currency.
