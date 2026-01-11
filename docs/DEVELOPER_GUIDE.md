# SpecBoard Developer Guide

> **Version**: 1.1.0
> **Last Updated**: 2026-01-08

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Testing Guide](#testing-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- pnpm 10.26.0 (recommended package manager)
- Git

### Initial Setup

1. **Clone the repository**:
```bash
git clone https://github.com/paulpham157/spec-board.git
cd spec-board
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/specboard"

# Server
PORT=3000

# OAuth (optional, for cloud sync)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# Better Auth
BETTER_AUTH_SECRET="your_random_secret_key"
BETTER_AUTH_URL="http://localhost:3000"
```

4. **Start PostgreSQL** (using Docker):
```bash
docker compose -f docker-compose.db.yml up -d
```

5. **Run database migrations**:
```bash
pnpm prisma migrate dev
```

6. **Start development server**:
```bash
pnpm dev
```

7. **Open browser**:
```
http://localhost:3000
```

---

## Development Workflow

### Project Structure Overview

```
spec-board/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   └── projects/     # Page routes
│   ├── components/       # React components
│   ├── lib/              # Business logic
│   │   ├── parser.ts     # Core markdown parser
│   │   ├── store.ts      # Zustand state
│   │   └── services/     # Cloud sync services
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
└── docs/                 # Documentation
```

### Development Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server

# Testing
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test:coverage    # Run with coverage report

# Database
pnpm prisma studio           # Open Prisma Studio GUI
pnpm prisma migrate dev      # Create and apply migration
pnpm prisma generate         # Regenerate Prisma client
pnpm prisma db push          # Push schema changes (dev only)

# Code Quality
pnpm lint             # Run ESLint
pnpm tsc --noEmit     # Type check without building
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Create route file**:
```bash
# Create src/app/api/your-endpoint/route.ts
```

2. **Implement handlers**:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ data: 'success' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: 'Missing required field' },
        { status: 400 }
      );
    }
    // Your logic here
    return NextResponse.json({ data: 'created' }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
```

3. **Test the endpoint**:
```bash
curl http://localhost:3000/api/your-endpoint
```

### Adding a New React Component

1. **Create component file**:
```bash
# Create src/components/your-component.tsx
```

2. **Implement component**:
```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { YourType } from '@/types';

interface Props {
  data: YourType;
  onAction: () => void;
}

export function YourComponent({ data, onAction }: Props) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={cn(
      'p-4 rounded-lg',
      isActive && 'bg-blue-100'
    )}>
      <h2 className="text-lg font-semibold">{data.title}</h2>
      <button
        onClick={() => {
          setIsActive(!isActive);
          onAction();
        }}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Toggle
      </button>
    </div>
  );
}
```

3. **Use the component**:
```typescript
import { YourComponent } from '@/components/your-component';

export default function Page() {
  return (
    <YourComponent
      data={{ title: 'Example' }}
      onAction={() => console.log('Action triggered')}
    />
  );
}
```

### Adding a New Parser

1. **Create parser file**:
```bash
# Create src/lib/markdown/your-parser.ts
```

2. **Implement parser**:
```typescript
import type { ParsedYourType } from '@/types';

export function parseYourMarkdown(content: string): ParsedYourType {
  const lines = content.split('\n');
  const result: ParsedYourType = {
    rawContent: content,
    sections: [],
  };

  let currentSection = '';
  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.slice(3).trim();
      result.sections.push({
        title: currentSection,
        content: '',
      });
    } else if (currentSection && result.sections.length > 0) {
      result.sections[result.sections.length - 1].content += line + '\n';
    }
  }

  return result;
}
```

3. **Add types**:
```typescript
// In src/types/index.ts
export interface ParsedYourType {
  rawContent: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}
```

4. **Write tests**:
```typescript
// In src/lib/markdown/your-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseYourMarkdown } from './your-parser';

describe('parseYourMarkdown', () => {
  it('should parse sections correctly', () => {
    const content = '## Section 1\nContent 1\n## Section 2\nContent 2';
    const result = parseYourMarkdown(content);

    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].title).toBe('Section 1');
    expect(result.sections[0].content).toContain('Content 1');
  });
});
```

### Modifying Database Schema

1. **Edit Prisma schema**:
```prisma
// In prisma/schema.prisma
model YourModel {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("your_models")
}
```

2. **Create migration**:
```bash
pnpm prisma migrate dev --name add_your_model
```

3. **Use in code**:
```typescript
import prisma from '@/lib/prisma';

// Create
const item = await prisma.yourModel.create({
  data: { name: 'Example' },
});

// Read
const items = await prisma.yourModel.findMany();

// Update
await prisma.yourModel.update({
  where: { id: 'item-id' },
  data: { name: 'Updated' },
});

// Delete
await prisma.yourModel.delete({
  where: { id: 'item-id' },
});
```

---

## Architecture Deep Dive

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Opens Project                                   │
│    - Home page → Open Project Modal                     │
│    - User selects filesystem path                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Auto-Registration                                    │
│    POST /api/projects/register                          │
│    - Validates path exists                              │
│    - Checks for specs/ or .specify/                     │
│    - Returns existing or creates new project            │
│    - Generates unique slug (e.g., "my-todolist")        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Navigation                                           │
│    Navigate to /projects/{slug}                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Load Project Data                                    │
│    GET /api/projects/{slug} → get filePath              │
│    GET /api/project?path={filePath} → parse files       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Parser Execution                                     │
│    lib/parser.ts:                                       │
│    - parseProject() → reads all features                │
│    - parseFeature() → parses spec, plan, tasks          │
│    - parseTasksFile() → extracts tasks with markers     │
│    - parseUserStories() → extracts from spec.md         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. State Management                                     │
│    Zustand store (lib/store.ts):                        │
│    - setProject(parsedData)                             │
│    - addRecentProject(project, slug)                    │
│    - localStorage persistence                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Real-Time Updates                                    │
│    GET /api/watch?path={filePath} (SSE)                 │
│    - chokidar watches filesystem                        │
│    - On change: re-parse → send update event            │
│    - Client updates Zustand store                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 8. UI Rendering                                         │
│    - KanbanBoard renders features by stage              │
│    - FeatureDetail modal shows spec/plan/tasks          │
│    - Components subscribe to Zustand store              │
└─────────────────────────────────────────────────────────┘
```

### Parser System

The parser is the heart of SpecBoard. It transforms markdown files into structured data.

**Key Functions**:

```typescript
// Parse entire project
const project = await parseProject('/path/to/project');

// Parse single feature
const feature = await parseFeature('/path/to/feature');

// Parse task line
const task = parseTaskLine('- [ ] T001 [P] [US1] Create login form');
// Returns: { id: 'T001', completed: false, parallel: true, userStory: 'US1', ... }
```

**Task Format**:
```markdown
- [ ] T001 [P] [US1] Description
  │    │    │    │    └─ Task description
  │    │    │    └────── User story reference (optional)
  │    │    └─────────── Parallel marker (optional)
  │    └──────────────── Task ID (required)
  └───────────────────── Checkbox (required)
```

### State Management

Zustand store manages client-side state with localStorage persistence.

**Store Structure**:
```typescript
interface ProjectStore {
  // Current state
  project: Project | null;
  selectedFeature: Feature | null;
  isLoading: boolean;
  error: string | null;

  // Recent projects (persisted to localStorage)
  recentProjects: RecentProject[];

  // Actions
  setProject: (project: Project) => void;
  addRecentProject: (project: Project, slug?: string) => void;
  loadRecentProjects: () => void;
}
```

**Usage Example**:
```typescript
import { useProjectStore } from '@/lib/store';

function MyComponent() {
  const { project, setProject, isLoading } = useProjectStore();

  useEffect(() => {
    async function loadProject() {
      const data = await fetch('/api/project?path=/path/to/project');
      const project = await data.json();
      setProject(project);
    }
    loadProject();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  return <div>{project?.name}</div>;
}
```

---

## Testing Guide

### Running Tests

```bash
# Watch mode (recommended for development)
pnpm test

# Single run
pnpm test:run

# With coverage
pnpm test:coverage
```

### Writing Tests

**Unit Test Example**:
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { getStageColor } from './utils';

describe('getStageColor', () => {
  it('should return correct color for specify stage', () => {
    expect(getStageColor('specify')).toBe('text-gray-600');
  });

  it('should return correct color for complete stage', () => {
    expect(getStageColor('complete')).toBe('text-green-600');
  });
});
```

**API Route Test Example**:
```typescript
// src/app/api/health/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('should return 200 OK', async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ status: 'ok' });
  });
});
```

### Test Coverage

Current coverage targets:
- **Overall**: 80%+
- **Critical paths**: 95%+
- **Parser functions**: 90%+
- **API routes**: 85%+

---

## Deployment

### Docker Deployment

1. **Build and start services**:
```bash
docker compose up -d --build
```

2. **Check logs**:
```bash
docker compose logs -f app
```

3. **Stop services**:
```bash
docker compose down
```

### PM2 Deployment

1. **Build application**:
```bash
pnpm build
```

2. **Start with PM2**:
```bash
pm2 start ecosystem.config.cjs
```

3. **Monitor**:
```bash
pm2 logs specboard
pm2 status
```

### Environment Variables for Production

```env
# Database
DATABASE_URL="postgresql://user:password@db:5432/specboard"

# Server
PORT=3000
NODE_ENV=production

# OAuth
GOOGLE_CLIENT_ID="production_client_id"
GOOGLE_CLIENT_SECRET="production_secret"
GITHUB_CLIENT_ID="production_client_id"
GITHUB_CLIENT_SECRET="production_secret"

# Better Auth
BETTER_AUTH_SECRET="production_random_secret"
BETTER_AUTH_URL="https://your-domain.com"
```

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem**: `Error: Can't reach database server`

**Solution**:
```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.db.yml ps

# Restart database
docker compose -f docker-compose.db.yml restart

# Check connection string in .env
echo $DATABASE_URL
```

#### Parser Errors

**Problem**: `Failed to parse project`

**Solution**:
1. Check markdown file format matches expected structure
2. Verify file paths are absolute, not relative
3. Check for malformed task lines (missing `T001` ID)
4. Ensure spec-kit directory structure exists

#### Real-Time Updates Not Working

**Problem**: File changes not reflected in UI

**Solution**:
1. Check file watcher permissions
2. Verify SSE connection in browser DevTools Network tab
3. Ensure project path is valid and accessible
4. Check console for errors

#### Build Errors

**Problem**: `Type error: Property 'x' does not exist`

**Solution**:
```bash
# Regenerate Prisma client
pnpm prisma generate

# Clear Next.js cache
rm -rf .next

# Rebuild
pnpm build
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=* pnpm dev
```

### Getting Help

- **Documentation**: Check `docs/` directory
- **Issues**: https://github.com/paulpham157/spec-board/issues
- **Contributing**: See `CONTRIBUTING.md`

---

## Best Practices

### Code Style

1. **Use TypeScript strict mode** - No `any` types
2. **Prefer functional components** - Use hooks over class components
3. **Keep components small** - Single responsibility principle
4. **Use Tailwind utilities** - Avoid custom CSS when possible
5. **Validate inputs** - Always validate user input and API requests

### Security

1. **Path validation** - Always use `isPathSafe()` for filesystem operations
2. **Input sanitization** - Sanitize markdown content with DOMPurify
3. **Environment variables** - Never commit secrets to git
4. **SQL injection** - Use Prisma parameterized queries
5. **XSS prevention** - Escape user-generated content

### Performance

1. **Lazy loading** - Use dynamic imports for large components
2. **Memoization** - Use `useMemo` and `useCallback` appropriately
3. **Database indexes** - Add indexes for frequently queried fields
4. **Caching** - Use `Cache-Control` headers for static content
5. **Bundle size** - Monitor and optimize bundle size

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Better Auth Documentation](https://www.better-auth.com/docs)
