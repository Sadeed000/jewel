  export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'gold' | 'diamond' | 'gemstone' | 'platinum' | 'silver';
  type: 'rings' | 'earrings' | 'pendants' | 'necklaces' | 'chains' | 'bracelets' | 'mangalsutra' | 'bangles' | 'nose-pin';
  price: number;
  originalPrice?: number;
  images: string[];
  metal: string;
  purity: string;
  weight: string;
  description: string;
  isBestseller?: boolean;
  isNew?: boolean;
  isExpertChoice?: boolean;
  inStock: boolean;
  collection?: string;
  occasion?: 'wedding' | 'daily-wear' | 'festive' | 'office' | 'party' | 'gifting';
  gemstone?: 'emerald' | 'ruby' | 'sapphire' | 'tanzanite' | 'pearl' | 'coral' | 'none';
  gender?: 'women' | 'men' | 'kids' | 'unisex';
  onlyOneLeft?: boolean;
}

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop`;

export const products: Product[] = [
  // ============== EARRINGS ==============
  { id: 'p001', slug: 'leaf-motif-gold-drop-earrings', name: 'Leaf Motif Gold Drop Earrings', category: 'gold', type: 'earrings', price: 68361, images: [img('photo-1535632787350-4e68ef0ac584'), img('photo-1611652022419-a9419f74343d')], metal: '22K Yellow Gold', purity: '22K', weight: '8.45 g', description: 'Inspired by the gentle curvature of leaves.', isBestseller: true, inStock: true, collection: 'Daily Wear', occasion: 'daily-wear', gender: 'women', onlyOneLeft: true },
  { id: 'p002', slug: 'enchanted-grid-gold-stud-earrings', name: 'Enchanted Grid Gold Stud Earrings', category: 'gold', type: 'earrings', price: 48311, originalPrice: 49576, images: [img('photo-1599643478518-a784e5dc4c8f')], metal: '22K Yellow Gold', purity: '22K', weight: '6.20 g', description: 'A modern lattice silhouette in lustrous gold.', inStock: true, occasion: 'office', gender: 'women' },
  { id: 'p003', slug: 'gilded-wave-gold-drop-earrings', name: 'Gilded Wave Gold Drop Earrings', category: 'gold', type: 'earrings', price: 85442, originalPrice: 87525, images: [img('photo-1535632066274-36f4c5f29f5f')], metal: '22K Yellow Gold', purity: '22K', weight: '10.10 g', description: 'Cascading waves of gold catch the light.', isNew: true, inStock: true, occasion: 'party', gender: 'women', onlyOneLeft: true },
  { id: 'p007', slug: 'swirl-pattern-diamond-stud-earrings', name: 'Swirl Pattern Diamond Stud Earrings', category: 'diamond', type: 'earrings', price: 47072, images: [img('photo-1535556261860-bf6cae87c0a7')], metal: '18K Yellow Gold', purity: '18K', weight: '3.80 g', description: 'A swirling dance of diamonds set in 18K gold.', inStock: true, occasion: 'festive', gender: 'women' },
  { id: 'p013', slug: 'breathtaking-onyx-stone-diamond-studs', name: 'Breathtaking Onyx Stone Diamond Studs', category: 'diamond', type: 'earrings', price: 53258, images: [img('photo-1602173574767-37ac01994b2a')], metal: '18K White Gold', purity: '18K', weight: '4.20 g', description: 'Black onyx framed by a brilliant halo.', inStock: true, gemstone: 'none', gender: 'women' },
  { id: 'p014', slug: 'golden-petal-gold-drop-earrings', name: 'Golden Petal Gold Drop Earrings', category: 'gold', type: 'earrings', price: 92364, images: [img('photo-1611591437281-460bfbe1220a')], metal: '22K Yellow Gold', purity: '22K', weight: '11.50 g', description: 'Hand-finished petals in pure 22K gold.', isBestseller: true, inStock: true, gender: 'women' },
  { id: 'p015', slug: 'pink-paradise-diamond-drop-earrings', name: 'Pink Paradise Diamond Drop Earrings', category: 'diamond', type: 'earrings', price: 115849, images: [img('photo-1605100804763-247f67b3557e')], metal: '18K Rose Gold', purity: '18K', weight: '5.80 g', description: 'Pink sapphires and brilliant diamonds.', isNew: true, inStock: true, gemstone: 'ruby', occasion: 'wedding', gender: 'women' },
  { id: 'p016', slug: 'love-spark-diamond-earrings', name: 'Love Spark Diamond Earrings', category: 'diamond', type: 'earrings', price: 111106, images: [img('photo-1573408301185-9146fe634ad0')], metal: '18K White Gold', purity: '18K', weight: '5.20 g', description: 'A spark of romance in every facet.', inStock: true, occasion: 'wedding', gender: 'women' },

  // ============== RINGS ==============
  { id: 'p008', slug: 'glorious-22-karat-yellow-gold-floral-ring', name: 'Glorious 22 Karat Yellow Gold Floral Ring', category: 'gold', type: 'rings', price: 31024, images: [img('photo-1605100804763-247f67b3557e')], metal: '22K Yellow Gold', purity: '22K', weight: '1.79 g', description: 'A blooming floral motif in 22K gold.', isExpertChoice: true, inStock: true, occasion: 'daily-wear', gender: 'women' },
  { id: 'p011', slug: 'bloom-bud-gold-ring', name: 'Bloom Bud Gold Ring', category: 'gold', type: 'rings', price: 67922, images: [img('photo-1602752250005-52934bc45613')], metal: '18K Rose Gold', purity: '18K', weight: '4.10 g', description: 'A delicate bud frozen mid-bloom.', inStock: true, gemstone: 'tanzanite', gender: 'women' },
  { id: 'p017', slug: 'verdant-bloom-gold-ring', name: 'Verdant Bloom Gold Ring', category: 'gemstone', type: 'rings', price: 65627, images: [img('photo-1602173574767-37ac01994b2a')], metal: '18K Rose Gold', purity: '18K', weight: '3.90 g', description: 'A jadeite stone in soft rose gold.', inStock: true, gemstone: 'emerald', onlyOneLeft: true, gender: 'women' },
  { id: 'p018', slug: 'flutter-wing-diamond-ring', name: 'Flutter Wing Diamond Ring', category: 'diamond', type: 'rings', price: 51829, images: [img('photo-1535632787350-4e68ef0ac584')], metal: '18K Yellow Gold', purity: '18K', weight: '2.80 g', description: 'Wings caught in mid-flutter, set with diamonds.', inStock: true, gender: 'women' },
  { id: 'p019', slug: 'alluring-gold-beaded-finger-ring', name: 'Alluring Gold Beaded Finger Ring', category: 'gold', type: 'rings', price: 70583, images: [img('photo-1535632066274-36f4c5f29f5f')], metal: '22K Yellow Gold', purity: '22K', weight: '8.20 g', description: 'Beaded craftsmanship in pure gold.', isBestseller: true, inStock: true, onlyOneLeft: true, gender: 'women' },
  { id: 'p020', slug: 'endless-charm-gold-finger-ring', name: 'Endless Charm Gold Finger Ring', category: 'gold', type: 'rings', price: 28713, originalPrice: 29299, images: [img('photo-1605100804763-247f67b3557e')], metal: '18K Yellow Gold', purity: '18K', weight: '2.10 g', description: 'A timeless band with a modern twist.', inStock: true, gender: 'women', onlyOneLeft: true },
  { id: 'p021', slug: 'sculpt-ridge-gold-ring', name: 'Sculpt Ridge Gold Ring', category: 'gold', type: 'rings', price: 100860, originalPrice: 102998, images: [img('photo-1573408301185-9146fe634ad0')], metal: '22K Yellow Gold', purity: '22K', weight: '11.80 g', description: 'Sculptural ridges in lustrous gold.', inStock: true, onlyOneLeft: true, gender: 'women' },
  { id: 'p022', slug: 'interlace-flow-gold-ring', name: 'Interlace Flow Gold Ring', category: 'gold', type: 'rings', price: 50137, originalPrice: 51394, images: [img('photo-1611591437281-460bfbe1220a')], metal: '18K Yellow Gold', purity: '18K', weight: '4.20 g', description: 'Interlaced bands flow seamlessly.', inStock: true, onlyOneLeft: true, gender: 'women' },
  { id: 'p023', slug: 'ornate-weave-gold-ring', name: 'Ornate Weave Gold Ring', category: 'gold', type: 'rings', price: 89510, originalPrice: 91557, images: [img('photo-1602173574767-37ac01994b2a')], metal: '22K Yellow Gold', purity: '22K', weight: '9.40 g', description: 'An ornate weave of pure gold strands.', inStock: true, onlyOneLeft: true, gender: 'women' },

  // ============== PENDANTS ==============
  { id: 'p004', slug: 'intricate-floral-pattern-gold-pendant', name: 'Intricate Floral Pattern Gold Pendant', category: 'gold', type: 'pendants', price: 26011, images: [img('photo-1605100804763-247f67b3557e')], metal: '22K Yellow Gold', purity: '22K', weight: '3.20 g', description: 'Delicate floral motifs in 22K gold.', isBestseller: true, inStock: true, onlyOneLeft: true, gender: 'women' },
  { id: 'p005', slug: 'abstract-ripple-gold-pendant', name: 'Abstract Ripple Gold Pendant', category: 'gold', type: 'pendants', price: 42791, originalPrice: 45684, images: [img('photo-1573408301185-9146fe634ad0')], metal: '22K Yellow Gold', purity: '22K', weight: '5.10 g', description: 'Sculptural ripples in contemporary form.', inStock: true, gender: 'women' },
  { id: 'p024', slug: 'golden-flame-pendant', name: 'Golden Flame Pendant', category: 'gold', type: 'pendants', price: 19157, images: [img('photo-1611591437281-460bfbe1220a')], metal: '18K Yellow Gold', purity: '18K', weight: '1.40 g', description: 'A delicate flame, eternally golden.', inStock: true, gender: 'women' },
  { id: 'p025', slug: 'dainty-gold-pendant-with-om', name: 'Dainty Gold Pendant with Om and Ganesha', category: 'gold', type: 'pendants', price: 29558, images: [img('photo-1605100804763-247f67b3557e')], metal: '22K Yellow Gold', purity: '22K', weight: '2.30 g', description: 'A dainty piece for everyday auspice.', isExpertChoice: true, inStock: true, gender: 'unisex' },
  { id: 'p026', slug: 'ethnic-elegant-pendant', name: 'Ethnic Elegant Pendant', category: 'gold', type: 'pendants', price: 45851, images: [img('photo-1573408301185-9146fe634ad0')], metal: '22K Yellow Gold', purity: '22K', weight: '3.80 g', description: 'Ethnic motifs in elegant proportions.', inStock: true, onlyOneLeft: true, gender: 'women' },
  { id: 'p027', slug: 'floral-filigree-gold-pendant', name: 'Floral Filigree Gold Pendant', category: 'gold', type: 'pendants', price: 93091, images: [img('photo-1602173574767-37ac01994b2a')], metal: '22K Yellow Gold', purity: '22K', weight: '8.10 g', description: 'Filigree petals in masterful detail.', inStock: true, onlyOneLeft: true, gender: 'women' },

  // ============== MANGALSUTRA ==============
  { id: 'p010', slug: 'heritage-watti-gold-mangalsutra', name: 'Heritage Watti Gold Mangalsutra', category: 'gold', type: 'mangalsutra', price: 173146, images: [img('photo-1602751584552-8ba73aad10e1')], metal: '22K Yellow Gold', purity: '22K', weight: '24.50 g', description: 'Heritage-inspired with traditional black beads.', inStock: true, collection: 'Wedding', occasion: 'wedding', gender: 'women', onlyOneLeft: true },
  { id: 'p028', slug: 'fancy-cylindrical-design-gold-mangalsutra', name: 'Fancy Cylindrical Design Gold Mangalsutra', category: 'gold', type: 'mangalsutra', price: 270214, images: [img('photo-1583292650898-7d22cd27ca6f')], metal: '22K Yellow Gold', purity: '22K', weight: '36.20 g', description: 'A cylindrical pendant on traditional beads.', inStock: true, occasion: 'wedding', onlyOneLeft: true, gender: 'women' },
  { id: 'p029', slug: 'dazzling-diamond-mangalsutra', name: 'Dazzling Diamond Mangalsutra', category: 'diamond', type: 'mangalsutra', price: 98528, images: [img('photo-1611591437281-460bfbe1220a')], metal: '18K White Gold', purity: '18K', weight: '6.80 g', description: 'Diamonds dazzle on this contemporary mangalsutra.', isBestseller: true, inStock: true, occasion: 'wedding', onlyOneLeft: true, gender: 'women' },
  { id: 'p030', slug: 'graceful-eccentric-mangalsutra', name: 'Graceful Eccentric Mangalsutra', category: 'gold', type: 'mangalsutra', price: 242415, images: [img('photo-1605100804763-247f67b3557e')], metal: '22K Yellow Gold', purity: '22K', weight: '32.10 g', description: 'A graceful, modern take on the classic.', inStock: true, occasion: 'wedding', onlyOneLeft: true, gender: 'women' },

  // ============== BRACELETS ==============
  { id: 'p009', slug: 'celestial-disc-gold-bracelet', name: 'Celestial Disc Gold Bracelet', category: 'gold', type: 'bracelets', price: 57106, images: [img('photo-1611591437281-460bfbe1220a')], metal: '18K Yellow Gold', purity: '18K', weight: '6.80 g', description: 'A celestial disc on a delicate chain.', inStock: true, onlyOneLeft: true, gender: 'women' },
  { id: 'p031', slug: 'understated-elegance-bracelet', name: 'Understated Elegance Bracelet', category: 'gold', type: 'bracelets', price: 115420, images: [img('photo-1573408301185-9146fe634ad0')], metal: '22K Yellow Gold', purity: '22K', weight: '12.40 g', description: 'Understated, with quiet confidence.', inStock: true, onlyOneLeft: true, gender: 'women' },
  { id: 'p032', slug: 'intricate-grace-bracelet', name: 'Intricate Grace Bracelet', category: 'gold', type: 'bracelets', price: 81967, originalPrice: 85643, images: [img('photo-1535632066274-36f4c5f29f5f')], metal: '22K Yellow Gold', purity: '22K', weight: '8.90 g', description: 'Intricate links of refined grace.', isBestseller: true, inStock: true, gender: 'women' },
  { id: 'p033', slug: 'contemporary-opulence-bracelet', name: 'Contemporary Opulence Bracelet', category: 'gold', type: 'bracelets', price: 56385, originalPrice: 57555, images: [img('photo-1602173574767-37ac01994b2a')], metal: '18K Yellow Gold', purity: '18K', weight: '5.20 g', description: 'A modern take on opulent design.', inStock: true, gender: 'women' },
  { id: 'p034', slug: 'wavy-gold-bracelet', name: 'Wavy Gold Bracelet', category: 'gold', type: 'bracelets', price: 156058, images: [img('photo-1611652022419-a9419f74343d')], metal: '22K Yellow Gold', purity: '22K', weight: '18.40 g', description: 'Waves of gold around the wrist.', inStock: true, gender: 'women' },
  { id: 'p035', slug: 'charming-leafy-bracelet', name: 'Charming Leafy Bracelet', category: 'gold', type: 'bracelets', price: 156543, images: [img('photo-1605100804763-247f67b3557e')], metal: '22K Yellow Gold', purity: '22K', weight: '17.80 g', description: 'Leafy charms on a delicate chain.', inStock: true, onlyOneLeft: true, gender: 'women' },

  // ============== CHAINS ==============
  { id: 'p036', slug: 'simple-gold-chain-for-kids', name: 'Simple Gold Chain for Kids', category: 'gold', type: 'chains', price: 43488, images: [img('photo-1599643478518-a784e5dc4c8f')], metal: '22K Yellow Gold', purity: '22K', weight: '4.80 g', description: 'A first chain, beautifully simple.', isBestseller: true, inStock: true, gender: 'kids' },
  { id: 'p037', slug: 'slender-gold-chain', name: 'Slender Gold Chain', category: 'gold', type: 'chains', price: 41679, images: [img('photo-1611652022419-a9419f74343d')], metal: '22K Yellow Gold', purity: '22K', weight: '4.50 g', description: 'A slender daily-wear chain.', isBestseller: true, inStock: true, gender: 'unisex' },
  { id: 'p038', slug: 'sleek-gold-foxtail-chain', name: 'Sleek Gold Foxtail Chain', category: 'gold', type: 'chains', price: 60458, images: [img('photo-1605100804763-247f67b3557e')], metal: '22K Yellow Gold', purity: '22K', weight: '6.80 g', description: 'A sleek foxtail weave for everyday luxury.', isBestseller: true, inStock: true, gender: 'unisex' },

  // ============== GEMSTONE HEROES ==============
  { id: 'p012', slug: 'tropical-canopy-gemstone-drop-earrings', name: 'Tropical Canopy Gemstone Drop Earrings', category: 'gemstone', type: 'earrings', price: 121375, images: [img('photo-1611591437281-460bfbe1220a')], metal: '18K Rose Gold', purity: '18K', weight: '7.20 g', description: 'Pink tourmaline gemstones suspended like blooms.', isNew: true, inStock: true, gemstone: 'ruby', onlyOneLeft: true, gender: 'women' },
  { id: 'p039', slug: 'bloom-symphony-gold-necklace', name: 'Bloom Symphony Gold Necklace', category: 'gemstone', type: 'necklaces', price: 425000, images: [img('photo-1611591437281-460bfbe1220a')], metal: '22K Yellow Gold', purity: '22K', weight: '38.40 g', description: 'A symphony of emeralds and rubies in bloom.', isExpertChoice: true, inStock: true, gemstone: 'emerald', occasion: 'wedding', gender: 'women' },
  { id: 'p040', slug: 'tanzanite-radiance-pendant', name: 'Tanzanite Radiance Pendant', category: 'gemstone', type: 'pendants', price: 87600, images: [img('photo-1591437694631-c2d04bb8b9c5')], metal: '18K White Gold', purity: '18K', weight: '4.80 g', description: 'A radiant tanzanite, ethereally blue.', isNew: true, inStock: true, gemstone: 'tanzanite', gender: 'women' },
  { id: 'p041', slug: 'pearl-cabochon-stud-earrings', name: 'Pearl Cabochon Stud Earrings', category: 'gemstone', type: 'earrings', price: 38900, images: [img('photo-1535632066274-36f4c5f29f5f')], metal: '18K Yellow Gold', purity: '18K', weight: '3.10 g', description: 'Lustrous pearls in classic cabochon setting.', inStock: true, gemstone: 'pearl', gender: 'women' },
  { id: 'p042', slug: 'emerald-eternity-band', name: 'Emerald Eternity Band', category: 'gemstone', type: 'rings', price: 156400, images: [img('photo-1605100804763-247f67b3557e')], metal: '18K Yellow Gold', purity: '18K', weight: '4.20 g', description: 'An eternity of emerald brilliance.', inStock: true, gemstone: 'emerald', occasion: 'wedding', gender: 'women' },
  { id: 'p043', slug: 'sapphire-sky-pendant', name: 'Sapphire Sky Pendant', category: 'gemstone', type: 'pendants', price: 64200, images: [img('photo-1573408301185-9146fe634ad0')], metal: '18K White Gold', purity: '18K', weight: '3.80 g', description: 'A piece of the night sky, wearable.', inStock: true, gemstone: 'sapphire', gender: 'women' },
  { id: 'p044', slug: 'ruby-rosette-earrings', name: 'Ruby Rosette Earrings', category: 'gemstone', type: 'earrings', price: 98750, images: [img('photo-1611591437281-460bfbe1220a')], metal: '18K Yellow Gold', purity: '18K', weight: '4.60 g', description: 'Rubies arranged like rose petals.', isBestseller: true, inStock: true, gemstone: 'ruby', occasion: 'festive', gender: 'women' },
  { id: 'p045', slug: 'coral-coast-bangle', name: 'Coral Coast Bangle', category: 'gemstone', type: 'bangles', price: 112300, images: [img('photo-1602173574767-37ac01994b2a')], metal: '22K Yellow Gold', purity: '22K', weight: '14.20 g', description: 'Coral hues meet golden warmth.', inStock: true, gemstone: 'coral', gender: 'women' },

  // ============== DAILY WEAR ==============
  { id: 'p046', slug: 'canopy-frame-drop-earrings', name: 'Canopy Frame Drop Earrings', category: 'gold', type: 'earrings', price: 85889, images: [img('photo-1535632787350-4e68ef0ac584')], metal: '22K Yellow Gold', purity: '22K', weight: '9.80 g', description: 'A canopy frames each delicate drop.', inStock: true, occasion: 'daily-wear', gender: 'women' },
  { id: 'p047', slug: 'petal-curl-gold-drop-earrings', name: 'Petal Curl Gold Drop Earrings', category: 'gold', type: 'earrings', price: 111375, images: [img('photo-1611591437281-460bfbe1220a')], metal: '22K Yellow Gold', purity: '22K', weight: '12.10 g', description: 'Curled petals in pure gold.', inStock: true, occasion: 'daily-wear', gender: 'women' },
  { id: 'p048', slug: 'rainbow-prism-diamond-stud-earrings', name: 'Rainbow Prism Diamond Stud Earrings', category: 'diamond', type: 'earrings', price: 46745, images: [img('photo-1599643478518-a784e5dc4c8f')], metal: '18K Yellow Gold', purity: '18K', weight: '3.20 g', description: 'A prism of light in every stud.', inStock: true, occasion: 'daily-wear', gender: 'women' },
  { id: 'p049', slug: 'whispering-leaf-gold-drop-earrings', name: 'Whispering Leaf Gold Drop Earrings', category: 'gold', type: 'earrings', price: 81804, images: [img('photo-1611652022419-a9419f74343d')], metal: '22K Yellow Gold', purity: '22K', weight: '9.20 g', description: 'Leaves that whisper in the wind.', inStock: true, occasion: 'daily-wear', onlyOneLeft: true, gender: 'women' },
  { id: 'p050', slug: 'fluid-wing-diamond-stud-earrings', name: 'Fluid Wing Diamond Stud Earrings', category: 'diamond', type: 'earrings', price: 30867, images: [img('photo-1605100804763-247f67b3557e')], metal: '18K Yellow Gold', purity: '18K', weight: '2.40 g', description: 'Diamond wings, eternally fluid.', inStock: true, occasion: 'daily-wear', gender: 'women' },

  // ============== NECKLACES ==============
  { id: 'p051', slug: 'orbit-play-gold-necklace', name: 'Orbit Play Gold Necklace', category: 'gold', type: 'necklaces', price: 89876, originalPrice: 92465, images: [img('photo-1611591437281-460bfbe1220a')], metal: '22K Yellow Gold', purity: '22K', weight: '9.80 g', description: 'Orbital geometry in pure gold.', inStock: true, gender: 'women' },
];

export const collections = [
  { name: 'Rivaah — Bridal', slug: 'rivaah', image: img('photo-1583292650898-7d22cd27ca6f', 1200) },
  { name: 'Festive', slug: 'festive', image: img('photo-1611652022419-a9419f74343d', 1200) },
  { name: 'Polki Heritage', slug: 'polki', image: img('photo-1605100804763-247f67b3557e', 1200) },
  { name: 'Daily Wear', slug: 'daily-wear', image: img('photo-1535632787350-4e68ef0ac584', 1200) },
];

export const categories = [
  { name: 'Gold', slug: 'gold', image: img('photo-1611652022419-a9419f74343d', 600) },
  { name: 'Diamond', slug: 'diamond', image: img('photo-1602173574767-37ac01994b2a', 600) },
  { name: 'Gemstone', slug: 'gemstone', image: img('photo-1591437694631-c2d04bb8b9c5', 600) },
  { name: 'Platinum', slug: 'platinum', image: img('photo-1605100804763-247f67b3557e', 600) },
  { name: 'Silver', slug: 'silver', image: img('photo-1599643478518-a784e5dc4c8f', 600) },
];

// Helper queries
export const byType = (type: Product['type']) => products.filter((p) => p.type === type);
export const byOccasion = (o: Product['occasion']) => products.filter((p) => p.occasion === o);
export const byGemstone = (g: Product['gemstone']) => products.filter((p) => p.gemstone === g);
export const bestsellers = () => products.filter((p) => p.isBestseller);
export const newArrivals = () => products.filter((p) => p.isNew);
