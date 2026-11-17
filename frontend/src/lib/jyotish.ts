/**
 * Vedic gemstone recommendations.
 *
 * In Indian jewellery, a large share of coloured-stone buying is jyotish-led:
 * each rashi (moon sign) has a ruling planet, and each planet a corresponding
 * gemstone. This maps that tradition onto the stones actually in the
 * catalogue, so the finder always lands on something buyable.
 *
 * Deliberately honest about its limits: proper jyotish uses the moon sign,
 * which needs birth time *and* place to compute. Deriving a sign from the date
 * alone gives the sun sign. The UI says so and lets anyone pick their rashi
 * directly if they already know it.
 */

/** Product `gemstone` enum values this catalogue can actually match. */
export type CatalogueStone =
  | 'emerald'
  | 'ruby'
  | 'sapphire'
  | 'tanzanite'
  | 'pearl'
  | 'coral'
  | 'none';

export interface Rashi {
  key: string;
  /** Sanskrit name. */
  name: string;
  /** Western equivalent, for recognition. */
  western: string;
  lord: string;
  /** Traditional stone name, which may be more specific than the catalogue. */
  stoneName: string;
  /** Hindi/trade name, as customers usually search for it. */
  tradeName: string;
  /** Which catalogue stone to filter on. */
  catalogueStone: CatalogueStone;
  /** Fallback filter when no stone of that kind is stocked. */
  fallbackCategory?: 'gold' | 'diamond' | 'gemstone';
  benefit: string;
  /** Inclusive sun-sign date window, [startMonth, startDay, endMonth, endDay]. */
  window: [number, number, number, number];
  finger: string;
  metal: string;
}

export const RASHIS: Rashi[] = [
  {
    key: 'mesha',
    name: 'Mesha',
    western: 'Aries',
    lord: 'Mars (Mangal)',
    stoneName: 'Red Coral',
    tradeName: 'Moonga',
    catalogueStone: 'coral',
    benefit: 'Courage, drive and physical vitality. Traditionally worn to steady a restless mind.',
    window: [3, 21, 4, 19],
    finger: 'Ring finger',
    metal: 'Gold or copper',
  },
  {
    key: 'vrishabha',
    name: 'Vrishabha',
    western: 'Taurus',
    lord: 'Venus (Shukra)',
    stoneName: 'Diamond',
    tradeName: 'Heera',
    catalogueStone: 'none',
    fallbackCategory: 'diamond',
    benefit: 'Luxury, artistry and harmony in relationships.',
    window: [4, 20, 5, 20],
    finger: 'Middle or ring finger',
    metal: 'Platinum or white gold',
  },
  {
    key: 'mithuna',
    name: 'Mithuna',
    western: 'Gemini',
    lord: 'Mercury (Budh)',
    stoneName: 'Emerald',
    tradeName: 'Panna',
    catalogueStone: 'emerald',
    benefit: 'Clarity of thought, sharp communication and success in study or trade.',
    window: [5, 21, 6, 20],
    finger: 'Little finger',
    metal: 'Gold',
  },
  {
    key: 'karka',
    name: 'Karka',
    western: 'Cancer',
    lord: 'Moon (Chandra)',
    stoneName: 'Pearl',
    tradeName: 'Moti',
    catalogueStone: 'pearl',
    benefit: 'Emotional calm, restful sleep and intuition.',
    window: [6, 21, 7, 22],
    finger: 'Little finger',
    metal: 'Silver',
  },
  {
    key: 'simha',
    name: 'Simha',
    western: 'Leo',
    lord: 'Sun (Surya)',
    stoneName: 'Ruby',
    tradeName: 'Manik',
    catalogueStone: 'ruby',
    benefit: 'Authority, confidence and recognition in public life.',
    window: [7, 23, 8, 22],
    finger: 'Ring finger',
    metal: 'Gold',
  },
  {
    key: 'kanya',
    name: 'Kanya',
    western: 'Virgo',
    lord: 'Mercury (Budh)',
    stoneName: 'Emerald',
    tradeName: 'Panna',
    catalogueStone: 'emerald',
    benefit: 'Precision, analytical strength and steady nerves.',
    window: [8, 23, 9, 22],
    finger: 'Little finger',
    metal: 'Gold',
  },
  {
    key: 'tula',
    name: 'Tula',
    western: 'Libra',
    lord: 'Venus (Shukra)',
    stoneName: 'Diamond',
    tradeName: 'Heera',
    catalogueStone: 'none',
    fallbackCategory: 'diamond',
    benefit: 'Balance, refinement and lasting partnerships.',
    window: [9, 23, 10, 22],
    finger: 'Middle or ring finger',
    metal: 'Platinum or white gold',
  },
  {
    key: 'vrishchika',
    name: 'Vrishchika',
    western: 'Scorpio',
    lord: 'Mars (Mangal)',
    stoneName: 'Red Coral',
    tradeName: 'Moonga',
    catalogueStone: 'coral',
    benefit: 'Resilience, focus and protection from setbacks.',
    window: [10, 23, 11, 21],
    finger: 'Ring finger',
    metal: 'Gold or copper',
  },
  {
    key: 'dhanu',
    name: 'Dhanu',
    western: 'Sagittarius',
    lord: 'Jupiter (Guru)',
    stoneName: 'Yellow Sapphire',
    tradeName: 'Pukhraj',
    catalogueStone: 'sapphire',
    benefit: 'Wisdom, prosperity and good counsel. Widely worn for growth.',
    window: [11, 22, 12, 21],
    finger: 'Index finger',
    metal: 'Gold',
  },
  {
    key: 'makara',
    name: 'Makara',
    western: 'Capricorn',
    lord: 'Saturn (Shani)',
    stoneName: 'Blue Sapphire',
    tradeName: 'Neelam',
    catalogueStone: 'sapphire',
    benefit: 'Discipline and swift results. Traditionally trialled before wearing.',
    window: [12, 22, 1, 19],
    finger: 'Middle finger',
    metal: 'Silver or white gold',
  },
  {
    key: 'kumbha',
    name: 'Kumbha',
    western: 'Aquarius',
    lord: 'Saturn (Shani)',
    stoneName: 'Blue Sapphire',
    tradeName: 'Neelam',
    catalogueStone: 'sapphire',
    benefit: 'Perseverance, originality and steady progress.',
    window: [1, 20, 2, 18],
    finger: 'Middle finger',
    metal: 'Silver or white gold',
  },
  {
    key: 'meena',
    name: 'Meena',
    western: 'Pisces',
    lord: 'Jupiter (Guru)',
    stoneName: 'Yellow Sapphire',
    tradeName: 'Pukhraj',
    catalogueStone: 'sapphire',
    benefit: 'Compassion, imagination and spiritual growth.',
    window: [2, 19, 3, 20],
    finger: 'Index finger',
    metal: 'Gold',
  },
];

/**
 * Sun sign from a date of birth.
 *
 * This is the western/sayana sign, not the sidereal moon rashi a jyotishi
 * would calculate — the finder states that plainly rather than implying a
 * precision it doesn't have.
 */
export function rashiFromDate(dateString: string): Rashi | null {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;

  const month = date.getMonth() + 1;
  const day = date.getDate();

  // A window is either (start month, day >= start) or (end month, day <= end).
  // Makara spans the new year, but the same test covers it because the two
  // months are checked independently.
  return (
    RASHIS.find((r) => {
      const [startMonth, startDay, endMonth, endDay] = r.window;
      return (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay)
      );
    }) ?? null
  );
}

export function rashiByKey(key: string): Rashi | null {
  return RASHIS.find((r) => r.key === key) ?? null;
}

/** Product query that surfaces pieces matching a rashi's stone. */
export function filtersForRashi(rashi: Rashi): Record<string, string | number> {
  if (rashi.catalogueStone !== 'none') {
    return { gemstone: rashi.catalogueStone, limit: 8 };
  }
  return { category: rashi.fallbackCategory || 'gemstone', limit: 8 };
}
