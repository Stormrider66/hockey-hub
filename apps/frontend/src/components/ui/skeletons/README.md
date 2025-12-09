# Hockey Hub Skeleton Components

A comprehensive set of skeleton loading components for Hockey Hub, providing smooth loading states across all UI elements.

## Usage

```tsx
import { PlayerCardSkeleton, DashboardSkeleton } from '@/components/ui/skeletons';

// In your component
if (isLoading) {
  return <PlayerCardSkeleton />;
}

// Full page skeleton
if (isLoading) {
  return <DashboardSkeleton />;
}
```

## Available Skeletons

### Individual Components

- **PlayerCardSkeleton** - Player card with avatar, name, status, and medical badges
- **WorkoutCardSkeleton** - Workout session card with icon, title, description, and metrics
- **DashboardWidgetSkeleton** - Generic dashboard widget with configurable rows
- **TableRowSkeleton** - Table row with customizable column types
- **FormSkeleton** - Form with configurable field count
- **CalendarEventSkeleton** - Calendar event with time, title, and participants
- **ChatMessageSkeleton** - Chat message with avatar and content
- **ExerciseCardSkeleton** - Exercise library card with image and details
- **StatCardSkeleton** - Statistics card with icon, value, and trend
- **NavigationSkeleton** - Sidebar or header navigation

### Composite Skeletons

- **DashboardSkeleton** - Complete dashboard layout with stats, widgets
- **ListPageSkeleton** - List view with filters, table, and pagination
- **DetailPageSkeleton** - Detail/profile page with header and tabs

### Hockey Hub Specific

- **TeamRosterSkeleton** - Team roster with position groups
- **ScheduleCardSkeleton** - Schedule/event card
- **MedicalReportSkeleton** - Medical report with status and restrictions

## Examples

### Table with custom columns
```tsx
<TableRowSkeleton 
  columns={['checkbox', 'avatar', 'text', 'badge', 'action']} 
/>
```

### Form with custom fields
```tsx
<FormSkeleton fields={6} includeButtons={true} />
```

### Dashboard widget with rows
```tsx
<DashboardWidgetSkeleton rows={5} />
```

### Navigation (vertical or horizontal)
```tsx
<NavigationSkeleton items={6} orientation="vertical" />
```

### Chat message (own or other)
```tsx
<ChatMessageSkeleton isOwn={true} />
```

## Features

- ✅ Exact dimensions matching real components
- ✅ Smooth pulse animations
- ✅ Dark mode support
- ✅ TypeScript support
- ✅ Customizable through props
- ✅ Consistent styling with Hockey Hub design system

## Best Practices

1. **Match real component dimensions** - Skeletons should have the same size as loaded content
2. **Use appropriate skeleton** - Choose the skeleton that matches your component type
3. **Show immediately** - Display skeletons as soon as loading starts
4. **Consistent timing** - Keep skeleton visible for consistent duration
5. **Smooth transitions** - Fade out skeletons when content loads

## Dark Mode

All skeletons automatically adapt to dark mode using Tailwind's dark mode classes.

## Performance

Skeletons use the lightweight `Skeleton` base component with CSS animations for optimal performance.