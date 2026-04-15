/**
 * Shared waste-type label constants.
 * Kept in a standalone file so server-side routes (API routes, email helpers)
 * can import them without pulling in the Firebase client SDK.
 */
export const WASTE_TYPE_LABELS: Record<
  "general" | "recyclable" | "bulk" | "hazardous" | "biodegradable",
  { label: string; sub: string }
> = {
  biodegradable: { label: "Biodegradable", sub: "Organic Waste" },
  recyclable:    { label: "Recyclable",    sub: "Reusable Goods" },
  general:       { label: "Residual",      sub: "Non-Recyclable" },
  bulk:          { label: "Bulk Waste",    sub: "Large items" },
  hazardous:     { label: "Hazardous",     sub: "Special Waste" },
};
