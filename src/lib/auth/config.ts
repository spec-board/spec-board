/**
 * Better Auth server configuration (T017)
 * Configures email/password + Google + GitHub OAuth providers
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    // Require email verification before login
    requireEmailVerification: false, // Set to true in production
  },

  // OAuth providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Base URL for callbacks
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

// Export auth type for client
export type Auth = typeof auth;
