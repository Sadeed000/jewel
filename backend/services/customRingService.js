const AppError = require('../utils/AppError');

/**
 * Bespoke ring configurator pricing.
 *
 * Price is always computed here, on the server, from the saved rate card —
 * never accepted from the client. A configurator that trusted a posted price
 * would let anyone buy a two-carat emerald for ₹1.
 *
 * Rates are deliberately plain data so they can be tuned without touching
 * logic, and later moved into SiteSettings if merchandising wants to edit
 * them from the admin panel.
 */

/** Per-carat rates in ₹. Indicative mid-quality commercial grades. */
const STONES = {
  emerald: { label: 'Emerald', planet: 'Mercury', ratePerCarat: 45000, minCarat: 0.5, maxCarat: 5 },
  ruby: { label: 'Ruby', planet: 'Sun', ratePerCarat: 55000, minCarat: 0.5, maxCarat: 5 },
  sapphire: { label: 'Blue Sapphire', planet: 'Saturn', ratePerCarat: 38000, minCarat: 0.5, maxCarat: 5 },
  'yellow-sapphire': { label: 'Yellow Sapphire', planet: 'Jupiter', ratePerCarat: 32000, minCarat: 0.5, maxCarat: 5 },
  pearl: { label: 'Pearl', planet: 'Moon', ratePerCarat: 8000, minCarat: 1, maxCarat: 8 },
  coral: { label: 'Red Coral', planet: 'Mars', ratePerCarat: 6000, minCarat: 1, maxCarat: 8 },
  tanzanite: { label: 'Tanzanite', planet: null, ratePerCarat: 28000, minCarat: 0.5, maxCarat: 5 },
};

/** Metal rate per gram, and the typical band weight for each setting. */
const METALS = {
  '18k-yellow': { label: '18K Yellow Gold', ratePerGram: 5865 },
  '18k-rose': { label: '18K Rose Gold', ratePerGram: 5865 },
  '18k-white': { label: '18K White Gold', ratePerGram: 5980 },
  '22k-yellow': { label: '22K Yellow Gold', ratePerGram: 7170 },
  platinum: { label: 'Platinum 950', ratePerGram: 3400 },
};

/**
 * Settings differ in metal used and labour. `makingPercent` is charged on the
 * metal value, matching how Indian jewellers quote making charges.
 */
const SETTINGS = {
  solitaire: { label: 'Solitaire', grams: 3.2, makingPercent: 0.12 },
  halo: { label: 'Halo', grams: 4.5, makingPercent: 0.18 },
  'three-stone': { label: 'Three Stone', grams: 4.0, makingPercent: 0.16 },
  eternity: { label: 'Eternity Band', grams: 5.5, makingPercent: 0.2 },
  bezel: { label: 'Bezel', grams: 3.8, makingPercent: 0.14 },
};

const RING_SIZES = Array.from({ length: 17 }, (_, i) => String(i + 6)); // 6–22

const GST_RATE = 0.03;
const ENGRAVING_FEE = 500;
const ENGRAVING_MAX_CHARS = 20;

/** Everything the configurator UI needs to render itself. */
const getOptions = () => ({
  stones: Object.entries(STONES).map(([value, s]) => ({
    value,
    label: s.label,
    planet: s.planet,
    ratePerCarat: s.ratePerCarat,
    minCarat: s.minCarat,
    maxCarat: s.maxCarat,
  })),
  metals: Object.entries(METALS).map(([value, m]) => ({
    value,
    label: m.label,
    ratePerGram: m.ratePerGram,
  })),
  settings: Object.entries(SETTINGS).map(([value, s]) => ({
    value,
    label: s.label,
    grams: s.grams,
  })),
  sizes: RING_SIZES,
  engravingFee: ENGRAVING_FEE,
  engravingMaxChars: ENGRAVING_MAX_CHARS,
  gstRate: GST_RATE,
});

/**
 * Validate a configuration and price it.
 * Throws AppError(400) on anything unrecognised, so a tampered payload can't
 * produce a bogus total.
 */
const quote = (config = {}) => {
  const { stone, carat, metal, setting, size, engraving } = config;

  const stoneSpec = STONES[stone];
  if (!stoneSpec) throw new AppError('Please choose a valid gemstone.', 400);

  const metalSpec = METALS[metal];
  if (!metalSpec) throw new AppError('Please choose a valid metal.', 400);

  const settingSpec = SETTINGS[setting];
  if (!settingSpec) throw new AppError('Please choose a valid setting.', 400);

  if (size && !RING_SIZES.includes(String(size))) {
    throw new AppError('Please choose a valid ring size.', 400);
  }

  const caratValue = Number(carat);
  if (!Number.isFinite(caratValue)) {
    throw new AppError('Please choose a carat weight.', 400);
  }
  if (caratValue < stoneSpec.minCarat || caratValue > stoneSpec.maxCarat) {
    throw new AppError(
      `${stoneSpec.label} is available between ${stoneSpec.minCarat} and ${stoneSpec.maxCarat} carat.`,
      400
    );
  }

  const trimmedEngraving = typeof engraving === 'string' ? engraving.trim() : '';
  if (trimmedEngraving.length > ENGRAVING_MAX_CHARS) {
    throw new AppError(`Engraving is limited to ${ENGRAVING_MAX_CHARS} characters.`, 400);
  }

  // Larger stones cost disproportionately more per carat; a mild exponent
  // approximates that curve without a full price table.
  const stoneValue = Math.round(
    stoneSpec.ratePerCarat * caratValue * Math.pow(caratValue, 0.15)
  );
  const metalValue = Math.round(metalSpec.ratePerGram * settingSpec.grams);
  const makingCharges = Math.round(metalValue * settingSpec.makingPercent);
  const engravingFee = trimmedEngraving ? ENGRAVING_FEE : 0;

  const subtotal = stoneValue + metalValue + makingCharges + engravingFee;
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;

  return {
    config: {
      stone,
      carat: caratValue,
      metal,
      setting,
      size: size ? String(size) : undefined,
      engraving: trimmedEngraving || undefined,
    },
    labels: {
      stone: stoneSpec.label,
      metal: metalSpec.label,
      setting: settingSpec.label,
    },
    breakdown: {
      stoneValue,
      metalValue,
      makingCharges,
      engravingFee,
      gst,
    },
    subtotal,
    total,
    /** Human summary reused as the cart line's name. */
    description: `${caratValue}ct ${stoneSpec.label} ${settingSpec.label} in ${metalSpec.label}`,
  };
};

module.exports = { getOptions, quote, STONES, METALS, SETTINGS, RING_SIZES, ENGRAVING_FEE, ENGRAVING_MAX_CHARS };
