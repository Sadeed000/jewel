/**
 * Filter definitions shared by the client sidebar and the server-rendered
 * product pages.
 *
 * This module deliberately carries no 'use client' directive: a server
 * component that imports a *function* from a client module receives a client
 * reference proxy rather than the function itself, which fails at call time.
 * Keeping the data and the mapping here lets both sides import it safely.
 */

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  name: string;
  /** Query-string key, which is also the API parameter name. */
  param: string;
  options: FilterOption[];
  /** Ranges and toggles allow only one selection at a time. */
  single?: boolean;
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    name: 'Price',
    param: 'price',
    single: true,
    options: [
      { label: 'Under ₹25K', value: '0-25000' },
      { label: '₹25K - ₹50K', value: '25000-50000' },
      { label: '₹50K - ₹1L', value: '50000-100000' },
      { label: 'Above ₹1L', value: '100000-' },
    ],
  },
  {
    name: 'Category',
    param: 'category',
    options: [
      { label: 'Gold', value: 'gold' },
      { label: 'Diamond', value: 'diamond' },
      { label: 'Gemstone', value: 'gemstone' },
      { label: 'Platinum', value: 'platinum' },
      { label: 'Silver', value: 'silver' },
    ],
  },
  {
    name: 'Type',
    param: 'type',
    options: [
      { label: 'Rings', value: 'rings' },
      { label: 'Earrings', value: 'earrings' },
      { label: 'Pendants', value: 'pendants' },
      { label: 'Necklaces', value: 'necklaces' },
      { label: 'Chains', value: 'chains' },
      { label: 'Bracelets', value: 'bracelets' },
      { label: 'Mangalsutra', value: 'mangalsutra' },
      { label: 'Bangles', value: 'bangles' },
    ],
  },
  {
    name: 'Gender',
    param: 'gender',
    options: [
      { label: 'Women', value: 'women' },
      { label: 'Men', value: 'men' },
      { label: 'Kids', value: 'kids' },
      { label: 'Unisex', value: 'unisex' },
    ],
  },
  {
    name: 'Stone',
    param: 'gemstone',
    options: [
      { label: 'Emerald', value: 'emerald' },
      { label: 'Ruby', value: 'ruby' },
      { label: 'Sapphire', value: 'sapphire' },
      { label: 'Tanzanite', value: 'tanzanite' },
      { label: 'Pearl', value: 'pearl' },
      { label: 'Opal', value: 'opal' },
      { label: 'Moissanite', value: 'moissanite' },
      { label: 'No Stone', value: 'none' },
    ],
  },
  {
    name: 'Occasion',
    param: 'occasion',
    options: [
      { label: 'Daily Wear', value: 'daily-wear' },
      { label: 'Office', value: 'office' },
      { label: 'Festive', value: 'festive' },
      { label: 'Wedding', value: 'wedding' },
      { label: 'Party', value: 'party' },
      { label: 'Gifting', value: 'gifting' },
    ],
  },
  {
    name: 'Availability',
    param: 'inStock',
    single: true,
    options: [{ label: 'In Stock Only', value: 'true' }],
  },
];

/**
 * Convert URL search params into the filter object the products API expects,
 * so pages build exactly the query the sidebar writes.
 */
export function searchParamsToFilters(
  params: URLSearchParams | Record<string, string | undefined>
) {
  const get = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) : params[key];

  const filters: Record<string, string | number | boolean> = {};

  for (const group of FILTER_GROUPS) {
    const raw = get(group.param);
    if (!raw) continue;

    if (group.param === 'price') {
      // "25000-50000", or "100000-" for an open-ended top band.
      const [min, max] = raw.split('-');
      if (min) filters.minPrice = Number(min);
      if (max) filters.maxPrice = Number(max);
      continue;
    }

    if (group.param === 'inStock') {
      filters.inStock = raw === 'true';
      continue;
    }

    // The API accepts one value per field, so take the first of a multi-select.
    filters[group.param] = raw.split(',')[0];
  }

  const sort = get('sort');
  if (sort) filters.sort = sort;

  return filters;
}
