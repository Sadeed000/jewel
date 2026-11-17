'use client';

import { useState } from 'react';
import { MapPin, Phone, Clock, Navigation, Search } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';

const stores = [
  { name: 'Aurelia — Jaipur MI Road', address: 'MI Road, Panch Batti, Jaipur, Rajasthan 302001', phone: '0141 222 3456', hours: '10:00 AM - 9:00 PM', city: 'Jaipur' },
  { name: 'Aurelia — Mumbai Bandra', address: 'Linking Road, Bandra West, Mumbai 400050', phone: '022 2640 1122', hours: '10:30 AM - 9:30 PM', city: 'Mumbai' },
  { name: 'Aurelia — Delhi CP', address: 'A-12 Connaught Place, New Delhi 110001', phone: '011 2341 8800', hours: '10:00 AM - 9:00 PM', city: 'Delhi' },
  { name: 'Aurelia — Bangalore MG Road', address: '85 MG Road, Bengaluru 560001', phone: '080 2558 4477', hours: '10:00 AM - 9:30 PM', city: 'Bangalore' },
  { name: 'Aurelia — Chennai T Nagar', address: 'Pondy Bazaar, T Nagar, Chennai 600017', phone: '044 2433 9911', hours: '10:00 AM - 9:00 PM', city: 'Chennai' },
  { name: 'Aurelia — Hyderabad Banjara', address: 'Road No 12, Banjara Hills, Hyderabad 500034', phone: '040 2354 2200', hours: '10:30 AM - 9:30 PM', city: 'Hyderabad' },
];

export default function StoreLocatorPage() {
  const [query, setQuery] = useState('');
  const filtered = stores.filter(
    (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.city.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Store Locator' }]} />

      <div className="container-custom pb-16">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-brand-ink">Find a Boutique</h1>
          <p className="text-sm text-brand-muted mt-2 script-italic font-display text-lg">Visit us for a personal experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative mb-6">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="search"
                placeholder="Search by city or pincode"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-brand-cream-dark rounded-full text-sm outline-none focus:border-brand-gold"
              />
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filtered.map((s, i) => (
                <div key={i} className="bg-white border border-brand-cream-dark rounded-lg p-5 hover:border-brand-gold transition-colors cursor-pointer">
                  <h3 className="font-display text-lg text-brand-ink">{s.name}</h3>
                  <div className="mt-3 space-y-2 text-sm text-brand-ink/80">
                    <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-brand-gold-dark flex-none" />{s.address}</p>
                    <p className="flex items-center gap-2"><Phone size={14} className="text-brand-gold-dark" />{s.phone}</p>
                    <p className="flex items-center gap-2"><Clock size={14} className="text-brand-gold-dark" />{s.hours}</p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="text-xs text-brand-maroon font-medium flex items-center gap-1 hover:underline">
                      <Navigation size={12} /> Directions
                    </button>
                    <button className="text-xs text-brand-maroon font-medium hover:underline">Book Appointment</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="relative bg-brand-cream rounded-lg overflow-hidden min-h-[400px] lg:sticky lg:top-32 lg:self-start lg:h-[600px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#d5aa72_0%,transparent_50%),radial-gradient(circle_at_70%_70%,#5a1a1a_0%,transparent_60%)] opacity-10" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <MapPin size={48} className="text-brand-maroon mx-auto" />
                <p className="font-display text-xl text-brand-ink mt-3">Interactive Map</p>
                <p className="text-xs text-brand-muted mt-1">Integrate Google Maps API here</p>
              </div>
            </div>
            {/* Decorative pins */}
            {[
              { x: '25%', y: '35%' }, { x: '60%', y: '25%' }, { x: '45%', y: '55%' },
              { x: '75%', y: '60%' }, { x: '30%', y: '70%' }, { x: '65%', y: '80%' },
            ].map((p, i) => (
              <div key={i} className="absolute w-3 h-3 bg-brand-maroon rounded-full ring-4 ring-brand-maroon/20 animate-pulse" style={{ left: p.x, top: p.y }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
