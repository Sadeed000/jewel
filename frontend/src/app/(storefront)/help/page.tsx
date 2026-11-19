'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Phone, Mail, Plus, Minus } from 'lucide-react';
import Breadcrumb from '@/components/common/Breadcrumb';
import { useSubmitContact } from '@/hooks/useMisc';
import { useToast } from '@/components/providers/ToastProvider';
import { ApiError } from '@/lib/api';

type ContactField = 'name' | 'email' | 'phone' | 'subject' | 'message';
type ContactForm = Record<ContactField, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Client-side checks, matching (or slightly stricter than) the API's rules. */
function validateContact(f: ContactForm): Partial<Record<ContactField, string>> {
  const e: Partial<Record<ContactField, string>> = {};
  const name = f.name.trim();
  const phoneDigits = f.phone.replace(/\D/g, '');
  const message = f.message.trim();

  if (!name) e.name = 'Please enter your name.';
  else if (name.length < 2) e.name = 'Your name looks too short.';

  if (!f.email.trim()) e.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Please enter a valid email address, like name@example.com.';

  if (f.phone.trim()) {
    if (!/^[+\d\s-]+$/.test(f.phone.trim())) e.phone = 'Phone number can contain only digits, spaces, + and -.';
    else if (phoneDigits.length < 10 || phoneDigits.length > 15)
      e.phone = 'Please enter a 10-digit mobile number (or include your country code).';
  }

  if (!message) e.message = 'Please tell us how we can help.';
  else if (message.length < 10) e.message = `Your message is too short — please add a little more detail (${message.length}/10 characters).`;

  return e;
}

/** Turns API / network failures into a sentence a customer understands. */
function describeContactError(err: unknown): { title: string; description: string; field?: ContactField } {
  if (err instanceof ApiError) {
    const detail = err.details?.[0];
    const field = detail?.field as ContactField | undefined;
    const friendly: Partial<Record<ContactField, string>> = {
      name: 'Please check your name.',
      email: 'Please enter a valid email address.',
      phone: 'Please enter a valid phone number.',
      subject: 'The subject is too long.',
      message: 'Please write a slightly longer message.',
    };
    if (err.status === 400 && field && friendly[field]) {
      return { title: 'Please check your details', description: friendly[field]!, field };
    }
    if (err.status === 429) {
      return { title: 'Too many attempts', description: 'Please wait a minute and try again.' };
    }
    if (err.status >= 500) {
      return { title: "We couldn't send your message", description: 'Something went wrong on our side. Please try again in a moment, or call us.' };
    }
    return { title: "We couldn't send your message", description: err.message };
  }
  return {
    title: 'No connection',
    description: 'We could not reach our servers. Check your internet connection and try again.',
  };
}

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
  const [contactForm, setContactForm] = useState<ContactForm>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const toast = useToast();
  const submit = useSubmitContact();

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as ContactField;
    setContactForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear a field's error as soon as the customer edits it.
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Same rules as the API, checked first so the customer gets a specific,
    // friendly message instead of a round trip and a generic failure.
    const found = validateContact(contactForm);
    setErrors(found);
    const first = (Object.keys(found) as ContactField[])[0];
    if (first) {
      toast.error('Please check your details', { description: found[first] });
      document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    try {
      await submit.mutateAsync({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
      });
      setContactSuccess(true);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success('Message sent', { description: "Thank you for reaching out — we'll get back to you shortly." });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      const { title, description, field } = describeContactError(err);
      if (field) setErrors({ [field]: description });
      toast.error(title, { description });
    }
  };

  const fieldClass = (field: ContactField) =>
    `w-full px-4 py-3 border rounded outline-none text-sm ${
      errors[field] ? 'border-red-400 focus:border-red-500 bg-red-50/40' : 'border-brand-cream-dark focus:border-brand-gold'
    }`;

  const FieldError = ({ field }: { field: ContactField }) =>
    errors[field] ? (
      <p id={`${field}-error`} className="mt-1.5 text-xs text-red-600">
        {errors[field]}
      </p>
    ) : null;

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
          {/* noValidate: our own checks show friendly messages + a toast
              instead of the browser's native bubbles. */}
          <form onSubmit={handleContactSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  name="name"
                  placeholder="Your Name"
                  autoComplete="name"
                  maxLength={100}
                  value={contactForm.name}
                  onChange={handleContactChange}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  className={fieldClass('name')}
                />
                <FieldError field="name" />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  autoComplete="email"
                  maxLength={150}
                  value={contactForm.email}
                  onChange={handleContactChange}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={fieldClass('email')}
                />
                <FieldError field="email" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone (optional)"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={20}
                  value={contactForm.phone}
                  onChange={handleContactChange}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  className={fieldClass('phone')}
                />
                <FieldError field="phone" />
              </div>
              <div>
                <input
                  name="subject"
                  placeholder="Subject (optional)"
                  maxLength={150}
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  className={fieldClass('subject')}
                />
                <FieldError field="subject" />
              </div>
            </div>
            <div>
              <textarea
                name="message"
                placeholder="How can we help? (at least 10 characters)"
                maxLength={2000}
                value={contactForm.message}
                onChange={handleContactChange}
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? 'message-error' : undefined}
                rows={5}
                className={`${fieldClass('message')} resize-none`}
              />
              <div className="flex items-start justify-between gap-3">
                <FieldError field="message" />
                <span className="ml-auto mt-1.5 text-[11px] tabular-nums text-brand-muted">
                  {contactForm.message.trim().length}/2000
                </span>
              </div>
            </div>
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
