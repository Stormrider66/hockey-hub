# PreferencesPanel Component

## Overview
The PreferencesPanel is a React component that provides a user interface for managing application preferences using Redux state management. It's built using shadcn/ui components and follows the Hockey Hub design system guidelines.

## Features
- Language selection (English/Swedish)
- Theme switching (Light/Dark)
- Notification preferences management (Email, Push, SMS, In‑App)

## Dependencies
```bash
# Required packages
@reduxjs/toolkit
react-redux
# shadcn/ui components
@/components/ui/card
@/components/ui/label
@/components/ui/switch
@/components/ui/radio-group
```

## Redux Integration
The component uses the following Redux slice and hooks:
```typescript
// src/store/features/preferencesSlice.ts
interface PreferencesState {
  language: 'en' | 'sv';
  theme: 'light' | 'dark';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}
```

## Usage
```tsx
import { PreferencesPanel } from '@/components/PreferencesPanel';

function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <PreferencesPanel />
    </div>
  );
}
```

## Component Structure
1. **Card Layout**
   - Main container with max width of 2xl
   - Header with title and description
   - Content section with three main parts

2. **Language Selection**
   - Radio group for language choice
   - Options: English/Svenska
   - Uses Globe icon from lucide-react

3. **Theme Selection**
   - Radio group for theme choice
   - Options: Light/Dark
   - Dynamic icon (Sun/Moon) based on current theme

4. **Notification Settings**
   - Three toggle switches
   - Email notifications
   - Push notifications
   - SMS notifications
   - Uses Bell icon from lucide-react

## Redux Actions
```typescript
// Available actions
setLanguage(value: 'en' | 'sv')
setTheme(value: 'light' | 'dark')
toggleNotification(type: 'email' | 'push' | 'sms')
updateNotifications(settings: Partial<NotificationSettings>)
```

## Styling
- Uses Tailwind CSS for styling
- Follows Hockey Hub design system
- Responsive design with proper spacing
- Accessible form controls with labels

## Required Redux Setup
Make sure the following files are properly set up:
1. `src/store/store.ts` - Main Redux store configuration
2. `src/store/hooks.ts` - TypeScript-enabled Redux hooks
3. `src/store/features/preferencesSlice.ts` - Preferences state management

## Accessibility
- All form controls have associated labels
- Proper ARIA attributes through shadcn/ui components
- Keyboard navigation support
- High contrast text and icons

## Error Handling
The component assumes the Redux store is properly initialized with the preferences slice. Make sure to:
1. Add the preferences reducer to your store
2. Wrap your app with Redux Provider
3. Initialize the store with default preferences state

## File Structure
```
src/
├── components/
│   ├── PreferencesPanel.tsx
│   └── PreferencesPanel.README.md
├── store/
│   ├── store.ts
│   ├── hooks.ts
│   └── features/
│       └── preferencesSlice.ts
```

## Related Files
1. `PreferencesPanel.tsx` - Main component implementation
2. `store.ts` - Redux store configuration
3. `hooks.ts` - Custom Redux hooks
4. `preferencesSlice.ts` - Preferences state management

## Design System Compliance
This component follows the Hockey Hub design system guidelines:
- Uses shadcn/ui components
- Follows Tailwind CSS utility patterns
- Uses lucide-react icons
- Maintains consistent spacing and layout

## Testing

The component should be covered by both unit tests (React Testing Library) and accessibility checks (`jest-axe`).  A template test is provided below:

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PreferencesPanel } from '@/components/PreferencesPanel';

describe('PreferencesPanel', () => {
  it('renders without violations', async () => {
    const { container } = render(<PreferencesPanel />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('allows language change', () => {
    render(<PreferencesPanel />);
    screen.getByLabelText(/english/i).click();
    expect(/* redux store dispatch spy */).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'preferences/setLanguage', payload: 'en' })
    );
  });
});
```

Add a Cypress test to verify that toggling preferences persists across page reloads.  Refer to `testing-strategy.md` for naming conventions and coverage goals.