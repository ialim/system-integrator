import { estimateShippingTax } from './shipping-tax';

type PricingTier = 'base' | 'plus' | null;

type VolumeBreak = {
  minQty: number;
  discount: number;
};

type ProductLike = {
  unitCost?: any;
  msrp?: any;
  currency?: string | null;
  tierBaseDiscount?: any;
  tierPlusDiscount?: any;
  volumeBreaks?: any;
  supplier?: any;
  pricing?: any;
};

type LineItemLike = {
  qty: number;
  unitPrice?: any;
  product?: ProductLike | null;
};

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeTier = (tier?: string | null): PricingTier => {
  if (!tier) return null;
  const normalized = tier.toLowerCase();
  if (normalized.includes('plus')) return 'plus';
  if (normalized.includes('base')) return 'base';
  return null;
};

const normalizeVolumeBreaks = (value: any): VolumeBreak[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const minQty = toNumber(entry.min_qty ?? entry.minQty ?? entry.min ?? entry.qty ?? entry.quantity);
      const discount = toNumber(entry.discount ?? entry.discountRate ?? entry.rate);
      if (!Number.isFinite(minQty) || minQty <= 0) return null;
      if (!Number.isFinite(discount) || discount <= 0) return null;
      return {
        minQty,
        discount: clamp(discount, 0, 0.9)
      };
    })
    .filter((entry): entry is VolumeBreak => Boolean(entry))
    .sort((a, b) => b.minQty - a.minQty);
};

const getVolumeDiscount = (volumeBreaks: any, qty: number) => {
  const breaks = normalizeVolumeBreaks(volumeBreaks);
  for (const tier of breaks) {
    if (qty >= tier.minQty) {
      return { rate: tier.discount, minQty: tier.minQty };
    }
  }
  return { rate: 0, minQty: null as number | null };
};

const getTierDiscount = (product: ProductLike | null | undefined, tier: PricingTier) => {
  if (!product) return 0;
  if (tier === 'plus') return clamp(toNumber(product.tierPlusDiscount), 0, 0.9);
  if (tier === 'base') return clamp(toNumber(product.tierBaseDiscount), 0, 0.9);
  return 0;
};

const getBaseUnitPrice = (product: ProductLike | null | undefined, tier: PricingTier) => {
  if (!product) return 0;
  const pricing = product.pricing ?? undefined;
  if (tier === 'plus') {
    const plus = toNumber(pricing?.resellerPlus);
    if (plus > 0) return plus;
  }
  if (tier === 'base') {
    const base = toNumber(pricing?.resellerBase);
    if (base > 0) return base;
  }
  const reseller = toNumber(pricing?.resellerPriceNGN);
  if (reseller > 0) return reseller;
  const msrp = toNumber(product.msrp);
  if (msrp > 0) return msrp;
  return toNumber(product.unitCost);
};

const getCostUnit = (product: ProductLike | null | undefined) => {
  if (!product) return 0;
  const pricing = product.pricing ?? undefined;
  const baseCost = toNumber(pricing?.baseUnitCostNGN);
  if (baseCost > 0) return baseCost;
  return toNumber(product.unitCost);
};

export type LinePricing = {
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  qty: number;
  listTotal: number;
  discountTotal: number;
  discountRate: number;
  tierDiscount: number;
  volumeDiscount: number;
  volumeMinQty: number | null;
  total: number;
  costTotal: number;
  margin: number;
  shipping: number;
  tax: number;
  currency: string | null;
  override: boolean;
};

export type ProjectTotals = {
  currency: string | null;
  listSubtotal: number;
  discounts: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  margin: number;
  shippingMeta?: Record<string, any>;
  taxMeta?: Record<string, any>;
};

export function computeLinePricing(
  lineItem: LineItemLike,
  options: { pricingTier?: string | null; taxStatus?: string | null }
): LinePricing {
  const product = lineItem.product ?? null;
  const qty = Number.isFinite(lineItem.qty) ? lineItem.qty : 0;
  const override = lineItem.unitPrice !== null && lineItem.unitPrice !== undefined;
  const tier = normalizeTier(options.pricingTier);
  const baseUnitPrice = override ? toNumber(lineItem.unitPrice) : getBaseUnitPrice(product, tier);
  const tierDiscount = override ? 0 : getTierDiscount(product, tier);
  const volume = override ? { rate: 0, minQty: null } : getVolumeDiscount(product?.volumeBreaks, qty);
  const volumeDiscount = volume.rate;
  const discountRate = clamp(tierDiscount + volumeDiscount, 0, 0.9);
  const effectiveUnitPrice = override ? baseUnitPrice : baseUnitPrice * (1 - discountRate);
  const listTotal = baseUnitPrice * qty;
  const total = effectiveUnitPrice * qty;
  const discountTotal = listTotal - total;
  const costUnit = getCostUnit(product);
  const costTotal = costUnit * qty;
  const margin = total - costTotal;
  const shippingRate = clamp(toNumber(product?.supplier?.shippingRate), 0, 1);
  const shipping = total * shippingRate;
  const isTaxExempt = (options.taxStatus || '').toLowerCase().includes('exempt');
  const vatRate = isTaxExempt ? 0 : clamp(toNumber(product?.supplier?.vat), 0, 1);
  const tax = total * vatRate;
  const currency = product?.currency ?? null;

  return {
    baseUnitPrice,
    effectiveUnitPrice,
    qty,
    listTotal,
    discountTotal,
    discountRate,
    tierDiscount,
    volumeDiscount,
    volumeMinQty: volume.minQty,
    total,
    costTotal,
    margin,
    shipping,
    tax,
    currency,
    override
  };
}

export function computeProjectTotals(
  lineItems: LineItemLike[],
  options: { pricingTier?: string | null; taxStatus?: string | null; clientMeta?: any }
) {
  const totals: ProjectTotals = {
    currency: null,
    listSubtotal: 0,
    discounts: 0,
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    margin: 0
  };

  let currency: string | null = null;
  let multiCurrency = false;
  let lineShipping = 0;
  let lineTax = 0;

  for (const li of lineItems) {
    const pricing = computeLinePricing(li, options);
    totals.listSubtotal += pricing.listTotal;
    totals.discounts += pricing.discountTotal;
    totals.subtotal += pricing.total;
    lineShipping += pricing.shipping;
    lineTax += pricing.tax;
    totals.margin += pricing.margin;

    if (pricing.currency) {
      if (!currency) currency = pricing.currency;
      if (currency && pricing.currency !== currency) multiCurrency = true;
    }
  }

  const estimate = estimateShippingTax({
    subtotal: totals.subtotal,
    clientMeta: options.clientMeta,
    taxStatus: options.taxStatus
  });
  totals.shipping = estimate.shipping ?? lineShipping;
  totals.tax = estimate.tax ?? lineTax;
  if (estimate.shippingMeta) totals.shippingMeta = estimate.shippingMeta;
  if (estimate.taxMeta) totals.taxMeta = estimate.taxMeta;
  totals.total = totals.subtotal + totals.shipping + totals.tax;
  totals.currency = multiCurrency ? null : currency;

  return totals;
}
