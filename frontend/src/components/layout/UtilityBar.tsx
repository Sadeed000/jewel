'use client';

import Link from 'next/link';
import { ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser, useLogout } from '@/hooks/useAuth';

export default function UtilityBar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    setShowUserMenu(false);
  };

  return (
    <div className="hidden md:block bg-brand-maroon-dark text-white text-xs">
      <div className="container-custom flex items-center justify-between h-9">
        <div className="flex items-center gap-6">
          <Link href="/account" className="hover:text-brand-gold-light transition-colors">
            Track Order
          </Link>
          <Link href="/help" className="hover:text-brand-gold-light transition-colors">
            Customer Service
          </Link>
          <Link href="/store-locator" className="hover:text-brand-gold-light transition-colors">
            Find a Store
          </Link>
          <Link href="/blog" className="hover:text-brand-gold-light transition-colors">
            Blog
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-1 hover:text-brand-gold-light transition-colors">
            <span>🇮🇳 India / EN</span>
            <ChevronDown size={12} />
          </button>
          
          {!isLoading && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 hover:text-brand-gold-light transition-colors"
              >
                <span>{user.firstName || user.email}</span>
                <ChevronDown size={12} />
              </button>
              
              {showUserMenu && (
                <div className="fixed right-6 top-9 w-48 bg-white text-brand-maroon shadow-lg rounded-md overflow-hidden z-[9999]">
                  <div className="px-4 py-2 border-b border-brand-cream font-semibold">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.email}
                  </div>
                  <Link
                    href="/account"
                    className="block px-4 py-2 hover:bg-brand-cream transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account"
                    className="block px-4 py-2 hover:bg-brand-cream transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={logout.isPending}
                    className="w-full text-left px-4 py-2 hover:bg-brand-cream transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    {logout.isPending ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/account/login" className="hover:text-brand-gold-light transition-colors">
                Sign In
              </Link>
              <span className="opacity-40">|</span>
              <Link href="/account/register" className="hover:text-brand-gold-light transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
