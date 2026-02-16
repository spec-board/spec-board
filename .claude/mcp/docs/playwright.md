# Playwright MCP Server

E2E browser automation and testing via Microsoft Playwright.

## Package

```bash
npx -y @playwright/mcp@latest
```

## Protocol Version

Compatible with MCP Protocol 2025-11-25

## Capabilities

- Cross-browser testing (Chrome, Firefox, WebKit, Edge)
- Mobile device emulation
- Network request interception
- Auto-wait for elements
- Screenshot and video capture
- Accessibility tree inspection
- JavaScript execution
- Drag and drop operations

## Command Options

| Option | Values | Description |
|--------|--------|-------------|
| `--browser` | chrome, firefox, webkit, msedge | Browser to use |
| `--headless` | - | Run without visible browser |
| `--viewport-size` | e.g., "1280x720" | Viewport dimensions |
| `--device` | e.g., "iPhone 15", "Pixel 7" | Device emulation |

## Available Tools

### Navigation Tools

| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to a URL |
| `browser_navigate_back` | Go back in history |
| `browser_navigate_forward` | Go forward in history |

### Interaction Tools

| Tool | Description |
|------|-------------|
| `browser_click` | Click an element (supports double-click, modifiers) |
| `browser_type` | Type text into an element (supports submit, slow typing) |
| `browser_drag` | Drag and drop between elements |
| `browser_select_option` | Select dropdown option |
| `browser_hover` | Hover over an element |

### Inspection Tools

| Tool | Description |
|------|-------------|
| `browser_snapshot` | Capture accessibility tree snapshot |
| `browser_screenshot` | Take screenshot |
| `browser_evaluate` | Execute JavaScript on page or element |

### Window Tools

| Tool | Description |
|------|-------------|
| `browser_resize` | Resize browser window |
| `browser_close` | Close browser |

## Tool Examples

### browser_navigate
```json
{
  "name": "browser_navigate",
  "arguments": {
    "url": "https://example.com/products"
  }
}
```

### browser_click
```json
{
  "name": "browser_click",
  "arguments": {
    "element": "Submit button",
    "ref": "e6",
    "doubleClick": false,
    "button": "left",
    "modifiers": ["Control"]
  }
}
```

### browser_type
```json
{
  "name": "browser_type",
  "arguments": {
    "element": "Email textbox",
    "ref": "e3",
    "text": "user@example.com",
    "submit": true,
    "slowly": false
  }
}
```

### browser_resize
```json
{
  "name": "browser_resize",
  "arguments": {
    "width": 1920,
    "height": 1080
  }
}
```

### browser_evaluate
```json
{
  "name": "browser_evaluate",
  "arguments": {
    "function": "() => document.title",
    "element": "Page body",
    "ref": "body"
  }
}
```

### browser_drag
```json
{
  "name": "browser_drag",
  "arguments": {
    "startElement": "Draggable item",
    "startRef": "#draggable",
    "endElement": "Drop target",
    "endRef": "#droppable"
  }
}
```

### browser_snapshot
```json
{
  "name": "browser_snapshot",
  "arguments": {}
}
```
Returns YAML representation of page accessibility tree.

## Usage Examples

```
"Test the login flow end-to-end"
"Fill out the registration form and verify success"
"Navigate through checkout and capture screenshots"
"Test responsive design on iPhone 15"
"Verify all links on the homepage work"
"Drag task from 'To Do' to 'Done' column"
"Execute JavaScript to get page title"
"Resize browser to test mobile layout"
```

## When to Use

| Scenario | Use Playwright? |
|----------|-----------------|
| E2E test automation | ✅ Yes |
| Form testing | ✅ Yes |
| User flow testing | ✅ Yes |
| Visual regression | ✅ Yes |
| Accessibility testing | ✅ Yes |
| Drag and drop testing | ✅ Yes |
| Quick inspection | ❌ Use Chrome DevTools |
| Debugging | ❌ Use Chrome DevTools |

## Security Notes

- Has full browser access - use with caution
- Only test on trusted/local sites
- Avoid real credentials in tests
- Review test actions before execution
- JavaScript execution can access page context

## Integration with Skills

- Works with `testing/playwright` skill for test patterns
- Use in `review` mode for UI testing
- Combine with `sequential-thinking` for complex test flows

## Resources

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev/)
