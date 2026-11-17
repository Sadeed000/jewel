'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRegister } from '@/hooks/useAuth'
import { useToast } from '@/components/providers/ToastProvider'

export default function RegisterForm() {
  const router = useRouter()
  const toast = useToast()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const [error, setError] = useState('')

  const register = useRegister()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))

    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      await register.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      })

      // Honour ?redirect= (checkout sends new customers here), but only for
      // same-site paths so it can't be used as an open redirect. Matches the
      // guard in the login page.
      const requested = new URLSearchParams(window.location.search).get('redirect')
      const safeRedirect =
        requested?.startsWith('/') && !requested.startsWith('//') ? requested : null

      toast.success('Account created', { description: 'Welcome to Aurelia.' })
      router.push(safeRedirect ?? '/account')
    } catch (err: any) {
      const message = err?.message || 'Registration failed. Please try again.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <div className="min-h-[80vh] grid md:grid-cols-2">
      {/* Visual */}
      <div className="relative hidden md:block">
        <Image
          src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200"
          alt="Register"
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-brand-maroon-dark/70 to-transparent" />

        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="script-italic font-display text-2xl text-brand-gold-light">
            Join
          </p>

          <h2 className="font-display text-5xl mt-1">
            Aurelia
          </h2>

          <p className="text-sm opacity-90 max-w-sm mt-3">
            Create your account to save wishlist items, track orders, and enjoy exclusive jewellery collections.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid place-items-center p-8">
        <div className="w-full max-w-md">
          <div className="flex border-b border-brand-cream-dark mb-8">
            <Link
              href="/account"
              className="flex-1 pb-3 text-sm font-medium text-center text-brand-muted hover:text-brand-maroon transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/account/register"
              className="flex-1 pb-3 text-sm font-medium text-center border-b-2 border-brand-maroon text-brand-maroon"
            >
              Register
            </Link>
          </div>

          <h1 className="font-display text-3xl text-brand-ink">
            Create Account
          </h1>

          <p className="text-sm text-brand-muted mt-1">
            Join the Aurelia family
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

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

            <button
              type="submit"
              disabled={register.isPending}
              className="btn-primary w-full disabled:opacity-60"
            >
              {register.isPending ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-brand-muted text-center mt-5">
            Already have an account?{' '}
            <Link
              href="/account"
              className="text-brand-maroon hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>

          <div className="flex items-center gap-3 my-5 text-xs text-brand-muted">
            <div className="flex-1 h-px bg-brand-cream-dark" />
            OR continue with
            <div className="flex-1 h-px bg-brand-cream-dark" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled
              className="py-3 border border-brand-cream-dark rounded-full text-sm hover:bg-brand-cream transition-colors disabled:opacity-60"
            >
              Google
            </button>

            <button
              disabled
              className="py-3 border border-brand-cream-dark rounded-full text-sm hover:bg-brand-cream transition-colors disabled:opacity-60"
            >
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}