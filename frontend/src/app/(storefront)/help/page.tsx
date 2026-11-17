'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Phone, Mail, Plus, Minus } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import { useSubmitContact } from '@/hooks/useMisc';

const faqs = [
  {
    q: 'How do I redeem Encircle Points?',
    a: 'You can redeem your Encircle Points at checkout. Sign in to your account, add items to your bag, and select "Use Encircle Points" on the payment page.',
  },
  {
    q: 'Do I need to pay shipping / delivery charges?',
    a: 'There are no shipping/delivery charges within India. For information on shipping charges for international orders please see the Shipping and Handling Charges section under Shipping Policy.',
  },
  {
    q: 'Can I send gifts to my loved ones?',
    a: 'Yes — choose "This is a gift" at checkout. We will package your order in a gift box with a personalised note.',
  },
  {
    q: 'What happens if my order is lost in transit?',
    a: 'All orders are fully insured. In the rare event a package is lost, we will arrange a replacement or full refund.',
  },
  {
    q: 'Questions on Cash On Delivery (COD)',
    a: 'COD is available for orders up to ₹50,000 in select pincodes. ID proof is required at delivery.',
  },
  {
    q: 'Questions on Tokenization',
    a: 'Per RBI guidelines, your card details are tokenised securely. You can save cards for faster checkout.',
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(1);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  const submit = useSubmitContact();

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit.mutateAsync({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        subject: contactForm.subject,
        message: contactForm.message,
      });
      setContactSuccess(true);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Help & Contact' }]} />

      <div className="container-custom pb-16">
        <h1 className="font-display text-4xl md:text-5xl text-brand-maroon text-center mb-10">Help & Contact</h1>

        {/* Contact options */}
        <div className="bg-gradient-to-br from-brand-cream to-white border border-brand-cream-dark rounded-2xl p-8 md:p-12 mb-12">
          <h2 className="text-center font-display text-2xl text-brand-ink mb-8">Have A Question</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x divide-brand-cream-dark">
            {[
              { icon: MessageSquare, title: 'Chat with Us', subtitle: 'Available 9am - 9pm IST' },
              { icon: Phone, title: 'Call Us At', subtitle: '1800-266-0123' },
              { icon: Mail, title: 'Write to Us', subtitle: 'hello@aurelia.com' },
            ].map((c) => (
              <div key={c.title} className="text-center px-6">
                <c.icon size={36} className="text-brand-maroon mx-auto" strokeWidth={1.5} />
                <p className="font-display text-xl text-brand-maroon mt-3">{c.title}</p>
                <p className="text-sm text-brand-ink mt-1">{c.subtitle}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-muted text-center mt-8 max-w-2xl mx-auto">
            The toll free number is only applicable for domestic orders within India. For international customers or
            deliveries please reach us out through whatsapp, Live chat or email.
          </p>
        </div>

        {/* Contact form */}
        <div className="max-w-2xl mx-auto mb-16 bg-white border border-brand-cream-dark rounded-lg p-8">
          <h2 className="font-display text-2xl text-brand-ink mb-6">Send us a Message</h2>
          {contactSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              ✓ Thank you for reaching out! We'll get back to you shortly.
            </div>
          )}
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Your Name"
                value={contactForm.name}
                onChange={handleContactChange}
                required
                className="px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={contactForm.email}
                onChange={handleContactChange}
                required
                className="px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                name="phone"
                placeholder="Phone (Optional)"
                value={contactForm.phone}
                onChange={handleContactChange}
                className="px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
              />
              <input
                name="subject"
                placeholder="Subject"
                value={contactForm.subject}
                onChange={handleContactChange}
                className="px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
              />
            </div>
            <textarea
              name="message"
              placeholder="Your message..."
              value={contactForm.message}
              onChange={handleContactChange}
              required
              rows={5}
              className="w-full px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm resize-none"
            />
            <button
              type="submit"
              disabled={submit.isPending}
              className="btn-primary w-full disabled:opacity-60"
            >
              {submit.isPending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* FAQs */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-brand-ink">Top Customer Questions</h2>
            <Link href="/faqs" className="text-sm text-brand-maroon font-semibold hover:underline">
              ALL FAQ&apos;S
            </Link>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white border border-brand-cream-dark rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-brand-maroon"
                >
                  <span>{f.q}</span>
                  {open === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                {open === i && (
                  <div className="px-6 pb-4 text-sm text-brand-ink/80 border-t border-brand-cream-dark pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
