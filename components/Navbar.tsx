"use client";

import Link from 'next/link';
// import { useTheme } from '@/context/ThemeContext'; // Removed
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { LogIn, UserPlus } from 'lucide-react';

export function Navbar() {
  // const { theme, toggleTheme } = useTheme(); // Removed

  return (
    <nav className="fixed top-0 w-full z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">DocuAI</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme toggle button removed */}
            <SignedOut>
              <SignInButton>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold"><LogIn className="w-4 h-4" />Log in</button>
              </SignInButton>
              <SignUpButton>
                <button className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-semibold"><UserPlus className="w-4 h-4" />Sign up</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}