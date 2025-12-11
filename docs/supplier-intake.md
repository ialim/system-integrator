# Supplier Intake

## Preferred ingest format
- CSV/XLSX with columns: `sku,name,brand,category,description,unit_cost,currency,msrp,lead_time_days,stock_band,volume_breaks,accessories,compat_requires,compat_blocks,bundle_components`.
- Volume breaks: JSON array of `{min_qty, discount}` (discount as decimal, e.g., 0.05 for 5%).
- Lead time: days to ship; stock band: in-stock/low/limited/backorder.

## PDF/Manual catalogs
- If suppliers only provide PDFs, extract to CSV and normalize to the template. Key attributes needed: SKU/model, name, protocol (Wi-Fi/Zigbee/Matter), power (e.g., 1/2/3 gang), material, price breaks, compatible panels/gateways, availability.
- For Golden Security PDF, captured sample rows you can convert:
  - `GS-4CDH` (desk stand for control panels), accessories.
  - `TPA08-M3A 8 Pro` (8" Tuya Zigbee/BLE gateway panel with audio/Alexa), price breaks by quantity.
  - `TPR01-B(EU)` (smart rotate panel with 3-way relay, Tuya Zigbee), price breaks.
  - `GS-X20U-1L1F-WIFI-PC` / `GS-X20U-1L1F-ZIGBEE-PC` (fan+light dimmer switches, Wi-Fi/Zigbee), price breaks.
  - `GS-X30U-1L1F-WIFI-Glass` / `GS-X30U-1L1F-Zigbee-Glass` (glass version), price breaks.
  - `F6-1`, `F6-2`, `GS-Q7` (6"/7" touch panels with Zigbee gateway + audio, qty pricing).
- For Minisim (Nigeria) PDF, captured sample rows:
  - Wi-Fi switches (1–8 gang, crystal glass, Tuya), various colors, NGN pricing (e.g., 1-gang Wi-Fi ≈ 25,000 NGN).
  - Zigbee switches (1–3 gang), NGN pricing (e.g., 1-gang Zigbee ≈ 27,000 NGN).
  - Sockets (single/double, with/without USB/Type-C), NGN pricing.
  - Dimmer, curtain, power strip, water heater/AC switches.

## Currency handling
- Store `currency` per product. Backend will convert to org currency only if FX rates are configured; otherwise show supplier currency with totals and add a clear FX note.

## Next steps to ingest
1) Ask suppliers for CSV/XLSX following the template; include quantity price breaks and lead-time/stock bands.
2) For PDFs, we can run a one-time extraction and review, then keep a recurring CSV feed.
3) Drop cleaned CSVs into `sample-data/` for seeds; map supplier -> brand for catalog faceting.
