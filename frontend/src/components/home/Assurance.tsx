const items = [
  { icon: '⊛', title: 'Aurelia Exchange', subtitle: 'Best value for your old gold' },
  { icon: '◈', title: 'Purity Guarantee', subtitle: 'BIS hallmarked & certified' },
  { icon: '⌬', title: 'Easy Replacements', subtitle: 'Swap with peace of mind' },
  { icon: '✦', title: 'Lifetime Maintenance', subtitle: 'Polish, plating & cleaning' },
];

export default function Assurance() {
  return (
    <section className="container-custom py-16">
      <div className="border border-brand-gold-light/40 rounded-2xl p-8 md:p-10 bg-gradient-to-br from-brand-cream to-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-brand-gold/10 blur-3xl pointer-events-none" />
        <div className="text-center mb-10 relative">
          <h2 className="font-display text-3xl md:text-4xl text-brand-ink">The Aurelia Assurance</h2>
          <p className="text-sm text-brand-muted mt-2 script-italic font-display text-lg">Crafted by experts, cherished by you.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
          {items.map((it) => (
            <div key={it.title} className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white border border-brand-gold-light grid place-items-center text-3xl text-brand-maroon mb-3 shadow-sm">
                {it.icon}
              </div>
              <p className="font-display text-lg text-brand-ink">{it.title}</p>
              <p className="text-xs text-brand-muted mt-1">{it.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
