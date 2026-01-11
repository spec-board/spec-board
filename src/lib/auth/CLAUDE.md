# Auth Directory

## Purpose
Better Auth configuration and authentication utilities for OAuth and API token management.

## Overview
This directory contains the Better Auth setup for SpecBoard's cloud sync feature. It provides OAuth authentication (Google, GitHub) and API token management for MCP server integration. Better Auth handles session management, OAuth flows, and secure token storage.

## Key Files

| File | Purpose |
|------|---------|
| `config.ts` | Better Auth configuration with OAuth providers |
| `client.ts` | Client-side auth utilities |
| `session.ts` | Session management utilities |
| `api-token.ts` | API token generation and validation |

## Patterns & Conventions

- **Better Auth**: Uses Better Auth library for OAuth and session management
- **OAuth Providers**: Google and GitHub configured with environment variables
- **Session Storage**: Sessions stored in PostgreSQL via Prisma
- **API Tokens**: JWT-based tokens for MCP server authentication
- **Secure Cookies**: HTTP-only cookies for session tokens

## Dependencies

- **Internal**: `@/lib/prisma` (database client)
- **External**: `better-auth` (authentication library)

## Common Tasks

### Add New OAuth Provider

1. Add provider credentials to `.env`:
```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

2. Add provider to `config.ts`:
```typescript
import { github } from 'better-auth/providers';

export const auth = betterAuth({
  providers: [
    google({ /* ... */ }),
    github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
});
```

### Generate API Token

Use the `api-token.ts` utilities:
```typescript
import { generateApiToken, validateApiToken } from '@/lib/auth/api-token';

// Generate token
const token = await generateApiToken(userId, 'My Token');

// Validate token
const payload = await validateApiToken(token);
```

### Check Session

Use the `session.ts` utilities:
```typescript
import { getSession } from '@/lib/auth/session';

const session = await getSession();
if (!session) {
  // User not authenticated
}
```

## Important Notes

- **Environment Variables Required**: OAuth credentials must be set in `.env`
- **Database Required**: Sessions and tokens stored in PostgreSQL
- **HTTPS Required**: OAuth callbacks require HTTPS in production
- **Token Expiration**: API tokens can have optional expiration dates
- **Session Expiration**: Sessions expire after 30 days of inactivity
- **Secure Cookies**: Cookies are HTTP-only and secure in production

## Authentication Flow

1. User clicks "Sign in with Google/GitHub"
2. Better Auth redirects to OAuth provider
3. User authorizes application
4. OAuth provider redirects back with code
5. Better Auth exchanges code for tokens
6. Session created and stored in database
7. Session cookie set in browser

## API Token Flow

1. User creates API token via `/api/tokens`
2. Token generated with JWT and stored in database
3. MCP server uses token in Authorization header
4. Token validated on each request
5. Token can be revoked via `/api/tokens/:id`
