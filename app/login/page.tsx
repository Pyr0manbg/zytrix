'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ZytrixLogo({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <div
      className={`relative grid place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#38BDF8] shadow-lg shadow-blue-500/20 ${className}`}
    >
      <svg viewBox="0 0 64 64" className="h-7 w-7 text-white">
        <path
          fill="currentColor"
          d="M16 14h32v6L27 44h21v6H16v-6l21-24H16z"
        />
      </svg>
      <div className="absolute inset-0 rounded-2xl border border-white/15" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      setSuccessMessage('');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || 'Login failed.');
        return;
      }

      setSuccessMessage('Login successful. Redirecting...');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('LOGIN ERROR:', error);
      setErrorMessage('Unexpected error while signing in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08111F] px-4 py-10 text-white">
      <div className="absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-[-140px] right-[-120px] h-[360px] w-[360px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%)]" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden border-r border-white/10 bg-gradient-to-br from-[#0B1220] via-[#0E172A] to-[#0A1120] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-6 flex items-center gap-4">
              <ZytrixLogo />
              <div>
                <p className="text-2xl font-semibold tracking-tight">Zytrix</p>
                <p className="text-sm text-slate-400">
                  Flow intelligence for brokers
                </p>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-white">
                Close more deals with less chaos.
              </h1>
              <p className="text-base leading-7 text-slate-300">
                Zytrix helps brokers stay organized, track conversations,
                follow up faster, and keep the whole day under control.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              'Client follow-ups in one place',
              'Call insights and next steps',
              'Fast daily workflow for brokers',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto flex w-full max-w-md flex-col justify-center">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex items-center gap-3">
                <ZytrixLogo className="h-10 w-10" />
                <div>
                  <p className="text-xl font-semibold">Zytrix</p>
                  <p className="text-sm text-slate-400">
                    Flow intelligence for brokers
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-blue-300/80">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Sign in to your workspace
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Use your Zytrix account to access clients, calls, calendar, and assistant tools.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-white outline-none transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-white/10 bg-[#0F172A] px-4 py-3 text-sm text-white outline-none transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#2563EB]/30"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#38BDF8] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-6 text-slate-500">
              Secure broker workflow access powered by Zytrix.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}