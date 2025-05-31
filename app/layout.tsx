'use client';

import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { dark } from '@clerk/themes';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#4f46e5',
    colorBackground: '#1e293b',
    colorInputBackground: '#334155',
    colorInputText: '#f8fafc',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    borderRadius: '0.5rem',
  },
  elements: {
    card: {
      backgroundColor: '#1e293b',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    },
    formButtonPrimary:
      'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold',
    socialButtonsBlockButton:
      'bg-slate-700 hover:bg-slate-600 text-white',
    dividerLine: 'bg-slate-600',
    dividerText: 'text-slate-400',
    formFieldInput: 
      'bg-slate-700 border-slate-600 text-slate-50 focus:ring-indigo-500 focus:border-indigo-500',
    footerActionText: 'text-slate-400',
    footerActionLink: 'text-indigo-400 hover:text-indigo-300',
    userButtonPopoverCard: {
        backgroundColor: '#1e293b',
    },
    userButtonPopoverActionButtonText: {
        color: '#f8fafc',
    },
    userButtonPopoverActionButtonIcon: {
        color: '#94a3b8',
    },
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className="h-full dark bg-slate-900">
        <head>
          <title>DocuAI - Modern UI</title>
          <link rel="icon" href="/images/logo-d.svg" type="image/svg+xml" />
          <meta
            name="description"
            content="Chat with your PDF documents using a modern, intuitive interface. Powered by local AI."
          />
          <meta property="og:title" content="DocuAI - Modern UI" />
          <meta
            property="og:description"
            content="Chat with your PDF documents using a modern, intuitive interface. Powered by local AI."
          />
          <meta property="og:image" content="/images/og-image.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="DocuAI - Modern UI" />
          <meta
            name="twitter:description"
            content="Chat with your PDF documents using a modern, intuitive interface. Powered by local AI."
          />
          <meta name="twitter:image" content="/images/og-image.png" />
        </head>
        <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-200`}>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen">
              <header className="flex justify-end items-center p-4 gap-4 h-16">
                <SignedOut>
                  <SignInButton />
                  <SignUpButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </header>
              <Navbar />
              <main className="flex-grow flex flex-col w-full">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
