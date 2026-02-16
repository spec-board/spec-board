# Magic MCP Server

AI-powered UI component generation.

## Package

```bash
npx -y @21st-dev/magic-mcp
```

Requires `TWENTY_FIRST_API_KEY` or `API_KEY` environment variable.

## Protocol Version

Compatible with MCP Protocol 2025-11-25

## Overview

Magic MCP from 21st.dev provides AI-powered UI component generation. It creates production-ready, customizable React/TypeScript components from natural language descriptions, inspired by the 21st.dev component library.

## Usage

Magic MCP is activated via the `/ui` slash command followed by a natural language description:

```
/ui [component description]
```

## Features

- **Natural language input**: Describe components in plain English
- **Production-ready output**: Clean, customizable React/TypeScript code
- **Project integration**: Auto-integrates with your project structure
- **Code style matching**: Adapts to your existing code patterns
- **Real-time preview**: See components as they're generated
- **SVGL assets**: Access to company logos and icons

## Usage Examples

```
/ui create a modern navigation bar with responsive design

/ui responsive navbar with logo and dark mode toggle

/ui create a responsive pricing card with a gradient background and a 'Get Started' button

/ui hero section with animated background and CTA buttons

/ui data table with sorting, filtering, and pagination

/ui modal dialog with form validation

/ui sidebar navigation with collapsible sections

/ui dashboard card with chart and stats
```

## Component Types

Magic MCP can generate various UI components:

| Category | Examples |
|----------|----------|
| Navigation | Navbar, sidebar, breadcrumbs, tabs |
| Layout | Hero sections, grids, cards, containers |
| Forms | Input fields, selects, checkboxes, validation |
| Feedback | Modals, toasts, alerts, progress bars |
| Data Display | Tables, lists, charts, stats cards |
| Interactive | Buttons, dropdowns, accordions, carousels |

## Output Format

Generated components include:
- React/TypeScript component code
- Tailwind CSS styling
- Responsive design
- Accessibility attributes
- TypeScript interfaces

## When to Use

| Scenario | Use Magic MCP? |
|----------|----------------|
| Quick UI prototyping | ✅ Yes |
| Component scaffolding | ✅ Yes |
| Design inspiration | ✅ Yes |
| Responsive components | ✅ Yes |
| Complex business logic | ❌ Manual coding |
| Existing component library | ❌ Use your library |

## Integration with Skills

- Works with `ui-ux-designer` agent for design implementation
- Use in `frontend` skills for rapid development
- Combine with `frontend-development` skill for React patterns

## Best Practices

1. **Be specific**: Include details about styling, behavior, responsiveness
2. **Mention framework**: Specify React, TypeScript, Tailwind if needed
3. **Describe interactions**: Include hover states, animations, transitions
4. **Reference designs**: Mention design systems (Material, shadcn, etc.)
5. **Iterate**: Refine prompts based on initial output

## Comparison with Figma MCP

| Feature | Magic MCP | Figma MCP |
|---------|-----------|-----------|
| Input | Natural language | Figma designs |
| Design source | AI-generated | Existing designs |
| Customization | Prompt-based | Design-based |
| Speed | Very fast | Depends on design |
| Accuracy | Good for common patterns | Exact to design |

## Resources

- [21st.dev](https://21st.dev)
- [Magic MCP GitHub](https://github.com/21st-dev/magic-mcp)
- [21st.dev Component Library](https://21st.dev/components)
