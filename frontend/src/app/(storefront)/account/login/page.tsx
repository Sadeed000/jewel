'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLogin, useRegister } from '@/hooks/useAuth';
import { useToast } from '@/components/providers/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');

  const login = useLogin();
  const register = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let user;

      if (mode === 'login') {
        ({ user } = await login.mutateAsync({ email: formData.email, password: formData.password }));
      } else {
        ({ user } = await register.mutateAsync({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }));
      }

      // Honour ?redirect= (set by AdminGuard when it bounces a signed-out
      // admin), but only for same-site paths so it can't be used as an
      // open redirect. Read here rather than via useSearchParams so the page
      // needs no Suspense boundary.
      const requested = new URLSearchParams(window.location.search).get('redirect');
      const safeRedirect = requested?.startsWith('/') && !requested.startsWith('//') ? requested : null;

      toast.success(mode === 'login' ? 'Welcome back' : 'Account created');
      router.push(safeRedirect ?? (user.role === 'admin' ? '/admin' : '/account'));
    } catch (err: any) {
      const message = err.message || 'Authentication failed. Please try again.';
      setError(message);
      toast.error(message);
    }
  };

  const isLoading = login.isPending || register.isPending;

  return (
    <div className="min-h-[80vh] grid md:grid-cols-2">
      {/* Visual */}
      <div className="relative hidden md:block">
        <Image
          src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-maroon-dark/70 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="script-italic font-display text-2xl text-brand-gold-light">Welcome to</p>
          <h2 className="font-display text-5xl mt-1">Aurelia</h2>
          <p className="text-sm opacity-90 max-w-sm mt-3">
            Sign in to unlock exclusive rewards, track orders, and craft your wishlist.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid place-items-center p-8">
        <div className="w-full max-w-md">
          <div className="flex border-b border-brand-cream-dark mb-8">
            
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'login' ? 'border-b-2 border-brand-maroon text-brand-maroon' : 'text-brand-muted'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'register' ? 'border-b-2 border-brand-maroon text-brand-maroon' : 'text-brand-muted'
              }`}
            >
              Register
            </button>
          </div>

          <h1 className="font-display text-3xl text-brand-ink">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Join the Aurelia family'}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
                />
              </div>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email or Mobile"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-brand-cream-dark rounded outline-none focus:border-brand-gold text-sm"
            />
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-brand-muted">
                  <input type="checkbox" className="accent-brand-maroon" />
                  Remember me
                </label>
                <Link href="/account/forgot" className="text-brand-maroon hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5 text-xs text-brand-muted">
            <div className="flex-1 h-px bg-brand-cream-dark" /> OR continue with{' '}
            <div className="flex-1 h-px bg-brand-cream-dark" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button disabled className="py-3 border border-brand-cream-dark rounded-full text-sm hover:bg-brand-cream transition-colors disabled:opacity-60">
              Google
            </button>
            <button disabled className="py-3 border border-brand-cream-dark rounded-full text-sm hover:bg-brand-cream transition-colors disabled:opacity-60">
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
