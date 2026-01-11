'use client';

/**
 * Login page for cloud sync authentication
 * Uses LoginForm and OAuthButtons components
 */

import { useRouter } from 'next/navigation';
import { ArrowLeft, Cloud } from 'lucide-react';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { ThemeButton } from '@/components/theme-button';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Image
                src="/images/specboard-logo.svg"
                alt="SpecBoard Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  Sign In
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Access your cloud projects
                </p>
              </div>
            </div>
            <ThemeButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* OAuth buttons */}
          <OAuthButtons />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--background)] text-[var(--muted-foreground)]">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email/password form */}
          <LoginForm redirectTo="/cloud" />
        </div>
      </main>
    </div>
  );
}
