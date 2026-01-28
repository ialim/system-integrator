type BomProject = {
  id?: number;
  name?: string;
  status?: string;
};

const csvValue = (value: any) => {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

export function buildBomCsv(snapshot: any, totals?: any, fallbackProject?: BomProject) {
  const project = snapshot?.project ?? fallbackProject ?? {};
  const lineItems = Array.isArray(snapshot?.lineItems) ? snapshot.lineItems : [];

  const header = [
    'project_id',
    'project_name',
    'project_status',
    'currency',
    'line_item_id',
    'room',
    'sku',
    'product',
    'qty',
    'unit_price',
    'effective_unit_price',
    'discount_rate',
    'line_total',
    'notes',
    'source'
  ];

  const rows: string[][] = lineItems.map((li: any) => {
    const product = li?.product ?? {};
    const room = li?.room ?? {};
    const pricing = li?.pricing ?? {};
    return [
      project?.id ?? '',
      project?.name ?? '',
      project?.status ?? '',
      product?.currency ?? '',
      li?.id ?? '',
      room?.name ?? '',
      product?.sku ?? '',
      product?.name ?? '',
      li?.qty ?? '',
      li?.unitPrice ?? '',
      pricing?.effectiveUnitPrice ?? '',
      pricing?.discountRate ?? '',
      pricing?.lineTotal ?? '',
      li?.notes ?? '',
      li?.source ?? ''
    ].map(csvValue);
  });

  if (totals && typeof totals === 'object') {
    const summaryNotes = [
      totals.subtotal !== undefined ? `subtotal=${totals.subtotal}` : null,
      totals.discounts !== undefined ? `discounts=${totals.discounts}` : null,
      totals.tax !== undefined ? `tax=${totals.tax}` : null,
      totals.shipping !== undefined ? `shipping=${totals.shipping}` : null,
      totals.total !== undefined ? `total=${totals.total}` : null,
      totals.margin !== undefined ? `margin=${totals.margin}` : null
    ]
      .filter(Boolean)
      .join('; ');
    rows.push(
      [
        project?.id ?? '',
        project?.name ?? '',
        project?.status ?? '',
        totals?.currency ?? '',
        '',
        '',
        '',
        'TOTALS',
        '',
        '',
        '',
        '',
        totals?.total ?? totals?.subtotal ?? '',
        summaryNotes,
        ''
      ].map(csvValue)
    );
  }

  return [header.map(csvValue).join(','), ...rows.map((row) => row.join(','))].join('\n');
}
