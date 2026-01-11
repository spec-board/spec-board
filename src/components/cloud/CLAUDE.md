# Cloud Components Directory

## Purpose
React components for cloud project management including project creation, team collaboration, and activity tracking.

## Overview
This directory contains UI components for SpecBoard's cloud sync feature. Components handle cloud project creation, connecting local projects to cloud, generating link codes for sharing, managing team members with role-based access, and displaying project activity feeds.

## Key Files

| File | Purpose |
|------|---------|
| `new-project-form.tsx` | Form for creating new cloud projects |
| `connect-project-modal.tsx` | Modal for connecting local projects to cloud |
| `link-code-generator.tsx` | Generate and display 6-character link codes |
| `team-members.tsx` | Team member list with role management |
| `role-selector.tsx` | Dropdown for selecting member roles |
| `activity-feed.tsx` | Timeline of sync events and activities |

## Patterns & Conventions

- **Client Components**: All components use `'use client'` directive
- **Form Validation**: Client-side validation before API calls
- **Optimistic Updates**: UI updates immediately, reverts on error
- **Loading States**: Show spinners during async operations
- **Error Handling**: Display error messages to user
- **Tailwind Styling**: Use `cn()` utility for conditional classes
- **Lucide Icons**: Consistent icon usage throughout

## Dependencies

- **Internal**: `@/lib/utils`, `@/types`, API routes
- **External**: `react`, `lucide-react`, `clsx`, `tailwind-merge`

## Common Tasks

### Add New Cloud Project Form Field

1. Update form state in `new-project-form.tsx`:
```typescript
const [formData, setFormData] = useState({
  name: '',
  slug: '',
  description: '',
  newField: '', // Add new field
});
```

2. Add input field to JSX:
```tsx
<input
  type="text"
  value={formData.newField}
  onChange={(e) => setFormData({ ...formData, newField: e.target.value })}
/>
```

3. Update API call to include new field

### Add New Role Type

1. Update `role-selector.tsx` with new role option
2. Update role descriptions and permissions
3. Update backend validation in API routes
4. Update database schema if needed

### Customize Activity Feed

1. Edit `activity-feed.tsx` to add new event types
2. Update event rendering logic
3. Add icons for new event types
4. Update timestamp formatting if needed

## Component Details

### new-project-form.tsx
- Form for creating cloud projects
- Validates name, slug, description
- Auto-generates slug from name
- Checks slug availability
- Creates project via `/api/cloud-projects`

### connect-project-modal.tsx
- Modal for connecting local projects
- Two modes: generate code or enter code
- Validates link codes
- Connects via `/api/cloud-projects/connect`
- Shows success/error messages

### link-code-generator.tsx
- Generates 6-character link codes
- Displays code with copy button
- Shows expiration countdown (1 hour)
- Refreshes code on expiration
- Uses `/api/cloud-projects/:id/links`

### team-members.tsx
- Lists all project members
- Shows member roles (VIEW, EDIT, ADMIN)
- Allows role changes (ADMIN only)
- Allows member removal (ADMIN only)
- Displays member avatars and emails
- Uses `/api/cloud-projects/:id/members`

### role-selector.tsx
- Dropdown for selecting member roles
- Three roles: VIEW, EDIT, ADMIN
- Shows role descriptions
- Disabled for non-admins
- Optimistic updates

### activity-feed.tsx
- Timeline of sync events
- Shows push/pull operations
- Displays conflict events
- Shows member changes
- Relative timestamps (e.g., "2 hours ago")
- Infinite scroll for pagination

## Important Notes

- **Authentication Required**: All components assume user is authenticated
- **Role-Based UI**: Components hide/disable actions based on user role
- **Optimistic Updates**: UI updates before API confirmation
- **Error Recovery**: Components revert state on API errors
- **Link Code Expiration**: Codes expire after 1 hour
- **Real-Time Updates**: Activity feed polls for new events
- **Responsive Design**: All components work on mobile and desktop
- **Accessibility**: ARIA labels and keyboard navigation supported
