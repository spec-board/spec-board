# Drivers Directory (Lib)

## Purpose
AI driver implementations for code execution (E2B sandbox integration).

## Overview
This directory contains the backend logic for executing AI-generated code in isolated sandbox environments using E2B. It provides abstractions for different driver types and manages execution sessions.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Main exports |
| `base.ts` | Base driver interface/abstract class |
| `e2b.ts` | E2B-specific driver implementation |
| `manager.ts` | Session management and lifecycle |
| `types.ts` | Driver and session type definitions |
| `keychain.ts` | API key management for drivers |

## Patterns & Conventions
- All drivers implement a common interface defined in `base.ts`
- Sessions are managed through `Manager` class
- API keys stored securely via keychain (uses system keytar)

## Dependencies
- **Internal**: `@/lib/*`, `@/types`
- **External**: @e2b/code-interpreter

## Common Tasks
- **Add new driver**: Implement base interface in new file
- **Configure API keys**: Use keychain.ts utilities

## Important Notes
- Server-side only (uses Node.js APIs)
- E2B provides isolated sandbox for code execution
- Keys stored in system keychain (never in code)
