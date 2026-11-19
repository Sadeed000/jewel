'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSubscribeNewsletter } from '@/hooks/useMisc';
import { useToast } from '@/components/providers/ToastProvider';
import { ApiError } from '@/lib/api';

export default function ExchangeNewsletter() {
  const [email, setEmail] = useState('');
  const subscribe = useSubscribeNewsletter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      toast.error('Please check your email', { description: 'Enter a valid email address, like name@example.com.' });
      return;
    }
    try {
      await subscribe.mutateAsync({ email: value, source: 'homepage-newsletter' });
      setEmail('');
      toast.success("You're subscribed", { description: "We'll send new collections and offers to your inbox." });
    } catch (err) {
      const description =
        err instanceof ApiError
          ? err.status === 429
            ? 'Too many attempts — please wait a minute and try again.'
            : err.status >= 500
              ? 'Something went wrong on our side. Please try again in a moment.'
              : err.message
          : 'We could not reach our servers. Check your connection and try again.';
      toast.error("Couldn't subscribe", { description });
    }
  };

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-maroon-dark via-brand-maroon to-brand-maroon-dark" />
      <Image
        src="https://res.cloudinary.com/dnsulnx1r/image/upload/v1795009705/ratnapankh/library/photo-1605100804763-247f67b3557e.jpg"
        alt=""
        fill
        className="object-cover opacity-15"
      />
      <div className="container-custom relative grid md:grid-cols-2 gap-10 items-center text-white">
        <div>
          <p className="script-italic font-display text-2xl text-brand-gold-light">Exchange Program</p>
          <h2 className="font-display text-4xl md:text-5xl mt-2">Trusted by 2.8M+ families</h2>
          <p className="mt-5 text-white/80 max-w-md text-sm leading-relaxed">
            Trust us to be part of your precious moments and to deliver jewellery that you&apos;ll cherish forever. Exchange your old gold for full value with the Aurelia Exchange Program.
          </p>
          <button className="mt-6 px-7 py-3 bg-brand-gold text-brand-maroon-dark text-sm font-semibold rounded-sm tracking-wider uppercase hover:bg-brand-gold-light transition-colors">
            Know More
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8">
          <h3 className="font-display text-2xl">Stay in the loop</h3>
          <p className="text-sm text-white/80 mt-1">Get early access to new collections, gold rate alerts, and exclusive offers.</p>
          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={subscribe.isPending}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white/95 text-brand-ink rounded-sm placeholder-brand-muted text-sm outline-none focus:ring-2 focus:ring-brand-gold disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={subscribe.isPending}
              className="px-6 py-3 bg-brand-gold text-brand-maroon-dark text-sm font-semibold rounded-sm tracking-wider uppercase hover:bg-brand-gold-light transition-colors disabled:opacity-60"
            >
              {subscribe.isPending ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
