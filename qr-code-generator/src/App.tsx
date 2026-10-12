import { QRCodeGenerator } from './components/QRCodeGenerator';

export function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Banner / Navigation */}
      <header className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/25">
            QR
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              Astro Island Ready · QR Code Generator
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vite + React + TypeScript + Tailwind CSS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Astro Island Ready
          </span>
        </div>
      </header>

      {/* Main Generator Card */}
      <main className="max-w-4xl mx-auto space-y-10">
        <QRCodeGenerator initialValue="https://astro.build" />

        {/* Astro Drop-In Integration Guide */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How to Drop into Your Astro Project
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            This component is fully self-contained in{' '}
            <code className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-indigo-600 dark:text-indigo-400">
              src/components/QRCodeGenerator.tsx
            </code>
            . Follow these steps to use it as an Astro island under the route{' '}
            <code className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-indigo-600 dark:text-indigo-400">
              /get-your-free-qr-code
            </code>
            :
          </p>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Step 1: Copy component and install dependency
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto">
{`# In your Astro project root:
npm install qrcode.react
# Copy QRCodeGenerator.tsx to your Astro components folder:
# src/components/QRCodeGenerator.tsx`}
              </pre>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Step 2: Create the Astro page at{' '}
                <span className="font-mono text-indigo-500">
                  src/pages/get-your-free-qr-code.astro
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto">
{`---
// src/pages/get-your-free-qr-code.astro
import Layout from '../layouts/Layout.astro';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
---

<Layout title="Free QR Code Generator">
  <main class="min-h-screen py-12 px-4">
    <!-- Client-side hydration island -->
    <QRCodeGenerator client:load />
  </main>
</Layout>`}
              </pre>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        Standalone React + TypeScript QR Generator. Safe for SSR and client-hydration.
      </footer>
    </div>
  );
}

export default App;
