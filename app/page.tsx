"use client";

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CubeIcon, GlobeAltIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative isolate pt-14">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                Chat with Your PDFs Using Local AI
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Experience the power of local AI for document analysis. Chat with your PDFs securely and privately, with all processing happening right on your device.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/app"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  Start Chatting
                </Link>
                <Link href="/sign-up" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-indigo-600 transition-colors flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v10.5A2.25 2.25 0 009.75 19.5h4.5A2.25 2.25 0 0016.5 17.25V13.5" />
                  </svg>
                  Create account <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="bg-white dark:bg-slate-800 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Advanced Features</h2>
              <p className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">
                Everything you need to analyze your documents
              </p>
              <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Choose from multiple AI models and process your documents with state-of-the-art technology, all while keeping your data private and secure. For some models, processing is done entirely local in your browser!
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-lg p-8 flex flex-col items-center text-center border border-gray-200 dark:border-slate-700">
                <CubeIcon className="h-10 w-10 mb-4 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ollama (Mistral)</h3>
                <p className="text-gray-600 dark:text-gray-300">Run Mistral-7B locally using Ollama for complete privacy and control over your document analysis.</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-lg p-8 flex flex-col items-center text-center border border-gray-200 dark:border-slate-700">
                <GlobeAltIcon className="h-10 w-10 mb-4 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">WebLLM (Phi-3.5)</h3>
                <p className="text-gray-600 dark:text-gray-300">Process documents entirely in your browser using the Phi-3.5 model, ensuring maximum privacy and speed. Entirely local in your browser!</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl shadow-lg p-8 flex flex-col items-center text-center border border-gray-200 dark:border-slate-700">
                <PuzzlePieceIcon className="h-10 w-10 mb-4 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chrome AI (Gemini Nano)</h3>
                <p className="text-gray-600 dark:text-gray-300">Leverage Chrome's built-in Gemini Nano model for efficient document processing with native integration.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
