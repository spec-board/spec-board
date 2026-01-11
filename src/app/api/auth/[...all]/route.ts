/**
 * Better Auth API route handler (T018)
 * Handles all auth endpoints: /api/auth/*
 */

import { auth } from '@/lib/auth/config';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
