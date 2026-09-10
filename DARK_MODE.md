# Dark Mode Implementation

## Overview
This application now includes a comprehensive dark mode implementation with smooth transitions, system preference detection, and keyboard shortcuts.

## Features

### 🌓 Theme Options
- **Light Mode**: Traditional light theme
- **Dark Mode**: Dark theme optimized for low-light environments
- **System**: Automatically follows system preference

### 🎨 Components Updated
- ✅ Main Layout (`layout.tsx`)
- ✅ Home Page (`page.tsx`)
- ✅ Chat Layout (`ChatLayout.tsx`)
- ✅ Chat Component (`ChatComponent.tsx`)
- ✅ Chat Sidebar (`ChatSidebar.tsx`)
- ✅ Message List (`MessageList.tsx`)
- ✅ PDF Viewer (`PDFViewer.tsx`)
- ✅ File Upload (`FileUpload.tsx`)
- ✅ Typing Indicator (`TypingIndicator.tsx`)
- ✅ Theme Toggle (`ThemeToggle.tsx`)

### 🎯 Theme Toggle Locations
1. **Home Page**: Top-right corner (icon only)
2. **Mobile Header**: Next to menu button
3. **Chat Header**: Next to PDF toggle button

### ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + Shift + T**: Cycle through themes (Light → Dark → System)

### 🔄 Automatic Features
- **System Preference Detection**: Automatically switches when system theme changes
- **Persistent Storage**: Remembers user preference in localStorage
- **Smooth Transitions**: 0.3s ease transitions for all theme changes

## Usage

### Basic Theme Toggle
```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

// Icon only (compact)
<ThemeToggle variant="icon" />

// With text
<ThemeToggle variant="compact" />

// Full button
<ThemeToggle />
```

### Using Theme Context
```tsx
import { useTheme } from "@/components/ThemeProvider";

function MyComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Custom Dark Mode Styles
The implementation uses Tailwind's `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content that adapts to theme
</div>
```

## Technical Details

### Theme Provider
- Located in `src/components/ThemeProvider.tsx`
- Manages theme state and persistence
- Handles system preference detection
- Provides keyboard shortcuts

### CSS Variables
Dark mode uses CSS custom properties defined in `globals.css`:
- Automatic color scheme switching
- Consistent design tokens
- Smooth transitions

### Storage
- Theme preference stored in `localStorage`
- Key: `chatpdf-ui-theme`
- Values: `"light"`, `"dark"`, `"system"`

## Browser Support
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Mobile browsers (full support)

## Accessibility
- Respects `prefers-color-scheme` media query
- Maintains proper contrast ratios
- Keyboard navigation support
- Screen reader friendly
