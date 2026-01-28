type ShippingRule = {
  rate: number;
  min?: number;
  max?: number;
  freeOver?: number;
};

type ShippingTaxEstimate = {
  shipping?: number | null;
  tax?: number | null;
  shippingMeta?: Record<string, any>;
  taxMeta?: Record<string, any>;
};

const SHIPPING_TABLE: Record<string, ShippingRule> = {
  NG: { rate: 0.02, min: 2500, max: 75000 },
  GH: { rate: 0.025, min: 3000, max: 80000 },
  KE: { rate: 0.03, min: 3500, max: 85000 },
  ZA: { rate: 0.02, min: 4000, max: 90000 },
  DEFAULT: { rate: 0.03, min: 5000, max: 100000 }
};

const VAT_TABLE: Record<string, number> = {
  NG: 0.075,
  GH: 0.125,
  KE: 0.16,
  ZA: 0.15
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

const normalizeCountry = (value?: string | null) => {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  if (!key) return null;
  const map: Record<string, string> = {
    ng: 'NG',
    nga: 'NG',
    nigeria: 'NG',
    gh: 'GH',
    gha: 'GH',
    ghana: 'GH',
    ke: 'KE',
    ken: 'KE',
    kenya: 'KE',
    za: 'ZA',
    zaf: 'ZA',
    'south africa': 'ZA'
  };
  if (map[key]) return map[key];
  if (key.length === 2) return key.toUpperCase();
  return null;
};

const getClientMeta = (clientMeta?: any) => {
  if (!clientMeta || typeof clientMeta !== 'object') return {};
  return clientMeta as Record<string, any>;
};

const extractCountry = (clientMeta?: any) => {
  const meta = getClientMeta(clientMeta);
  const candidates = [
    meta?.shipping?.country,
    meta?.shippingAddress?.country,
    meta?.address?.country,
    meta?.client?.country,
    meta?.country
  ];
  for (const candidate of candidates) {
    const normalized = normalizeCountry(candidate);
    if (normalized) return normalized;
  }
  return null;
};

const extractShippingMethod = (clientMeta?: any) => {
  const meta = getClientMeta(clientMeta);
  const method = String(meta?.shipping?.method ?? meta?.shippingMethod ?? '').toLowerCase();
  if (!method) return null;
  if (method.includes('pickup') || method.includes('collect')) return 'pickup';
  return method;
};

const extractTaxExempt = (clientMeta?: any) => {
  const meta = getClientMeta(clientMeta);
  return Boolean(meta?.taxExempt ?? meta?.tax?.exempt ?? false);
};

export function estimateShippingTax(args: {
  subtotal: number;
  clientMeta?: any;
  taxStatus?: string | null;
}): ShippingTaxEstimate {
  const subtotal = Number.isFinite(args.subtotal) ? args.subtotal : 0;
  const clientMeta = args.clientMeta || null;
  const country = extractCountry(clientMeta);
  const shippingMethod = extractShippingMethod(clientMeta);
  const shippingOverrideRate = toNumber(clientMeta?.shipping?.rate ?? clientMeta?.shippingRate);
  const shippingOverrideFlat = toNumber(clientMeta?.shipping?.flat ?? clientMeta?.shippingFlat);

  let shipping: number | null = null;
  let shippingMeta: Record<string, any> | null = null;

  if (shippingMethod === 'pickup') {
    shipping = 0;
    shippingMeta = { source: 'pickup' };
  } else if (shippingOverrideFlat > 0) {
    shipping = shippingOverrideFlat;
    shippingMeta = { source: 'override', flat: shippingOverrideFlat };
  } else if (shippingOverrideRate > 0 || country) {
    const rule = SHIPPING_TABLE[country || 'DEFAULT'] || SHIPPING_TABLE.DEFAULT;
    const rate = shippingOverrideRate > 0 ? clamp(shippingOverrideRate, 0, 1) : rule.rate;
    const raw = subtotal * rate;
    let amount = raw;
    if (rule.freeOver && subtotal >= rule.freeOver) {
      amount = 0;
    }
    if (rule.min !== undefined) amount = Math.max(amount, rule.min);
    if (rule.max !== undefined) amount = Math.min(amount, rule.max);
    shipping = amount;
    shippingMeta = { source: shippingOverrideRate > 0 ? 'override' : 'table', country, rate };
  }

  const isTaxExempt = extractTaxExempt(clientMeta) || (args.taxStatus || '').toLowerCase().includes('exempt');
  const taxOverrideRate = toNumber(clientMeta?.tax?.rate ?? clientMeta?.taxRate);
  let tax: number | null = null;
  let taxMeta: Record<string, any> | null = null;

  if (isTaxExempt) {
    tax = 0;
    taxMeta = { source: 'exempt' };
  } else if (taxOverrideRate > 0 || country) {
    const rate = taxOverrideRate > 0 ? clamp(taxOverrideRate, 0, 1) : VAT_TABLE[country || ''] || 0;
    if (rate > 0) {
      const base = subtotal + (shipping ?? 0);
      tax = base * rate;
      taxMeta = { source: taxOverrideRate > 0 ? 'override' : 'table', country, rate };
    }
  }

  return {
    shipping,
    tax,
    shippingMeta: shippingMeta || undefined,
    taxMeta: taxMeta || undefined
  };
}
