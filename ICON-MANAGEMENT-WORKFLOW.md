# Icon Management Workflow for Hockey Hub

## Overview
This document outlines the standardized workflow for managing icons across the Hockey Hub codebase. Following these guidelines ensures consistency, performance, and maintainability.

## Current State
- **Custom Icon System**: `@/components/icons` - Centralized icon exports
- **Primary Library**: lucide-react (tree-shakeable, TypeScript support)
- **Legacy Usage**: 200+ files still import directly from `lucide-react`

## Icon Management Rules

### 1. For New Development
**ALWAYS** import icons from the custom wrapper:
```tsx
// ✅ CORRECT
import { Heart, User, Settings } from '@/components/icons';

// ❌ INCORRECT - Never import directly
import { Heart } from 'lucide-react';
```

### 2. Adding New Icons
When you need an icon that's not yet exported:

1. **Check if it exists** in `@/components/icons/index.tsx`
2. **If not, add it**:
   ```tsx
   // components/icons/index.tsx
   export { 
     Heart, 
     User, 
     Settings,
     Plus, // ← Add your new icon here
   } from 'lucide-react';
   ```
3. **Use consistent naming**: Keep the original lucide-react name
4. **Commit message**: `feat: Add [IconName] icon to central exports`

### 3. When Modifying Existing Files
If you're working on a file that imports from `lucide-react` directly:
- **Update the import** to use `@/components/icons`
- **Test** that the icon still renders correctly
- **Include in your PR** as part of the changes

### 4. Custom Icons
For icons not available in lucide-react:

1. **Create a custom component**:
   ```tsx
   // components/icons/custom/HockeyStick.tsx
   export const HockeyStick = (props: IconProps) => (
     <svg
       width="24"
       height="24"
       viewBox="0 0 24 24"
       fill="none"
       stroke="currentColor"
       strokeWidth="2"
       {...props}
     >
       <path d="..." />
     </svg>
   );
   ```

2. **Export from the main file**:
   ```tsx
   // components/icons/index.tsx
   export { HockeyStick } from './custom/HockeyStick';
   ```

### 5. Icon Props Standardization
Always support these standard props:
```tsx
interface IconProps {
  size?: number | string;  // Default: 24
  color?: string;         // Default: currentColor
  className?: string;     // For additional styling
  strokeWidth?: number;   // Default: 2
}
```

## Performance Guidelines

### Bundle Size Monitoring
1. **Check impact**: Run `pnpm analyze` after adding multiple new icons
2. **Lazy load** heavy icons that are used infrequently:
   ```tsx
   // For rarely used icons
   const SpecialIcon = lazy(() => 
     import('@/components/icons').then(m => ({ default: m.SpecialIcon }))
   );
   ```

### Icon Sprite (Future Optimization)
When the icon count exceeds 100 unique icons, consider implementing a sprite system:
```tsx
// components/icons/sprite.tsx
// This is a future optimization - don't implement until needed
```

## Migration Strategy

### Phase 1: Prevention (Current)
- All new code uses `@/components/icons`
- Update imports when touching existing files
- Document the pattern in code reviews

### Phase 2: Gradual Migration (Ongoing)
- Update files as part of feature work
- No dedicated migration sprints
- Track progress quarterly

### Phase 3: Automated Migration (Future)
If needed, create a codemod:
```bash
# Future script to migrate all files
pnpm run migrate:icons
```

## Code Review Checklist

When reviewing PRs, check for:
- [ ] Icons imported from `@/components/icons`
- [ ] New icons added to central exports
- [ ] Consistent icon naming
- [ ] Proper TypeScript types
- [ ] No duplicate icon exports

## Common Patterns

### Conditional Icons
```tsx
import { Check, X } from '@/components/icons';
const StatusIcon = success ? Check : X;
```

### Dynamic Icons
```tsx
import * as Icons from '@/components/icons';
const DynamicIcon = Icons[iconName as keyof typeof Icons];
```

### With Tooltips
```tsx
import { Info } from '@/components/icons';
<Tooltip content="More information">
  <Info size={16} className="text-muted-foreground" />
</Tooltip>
```

## Testing Icons

### Visual Testing
```tsx
// In Storybook or test file
import * as Icons from '@/components/icons';

export const AllIcons = () => (
  <div className="grid grid-cols-8 gap-4">
    {Object.entries(Icons).map(([name, Icon]) => (
      <div key={name} className="text-center">
        <Icon />
        <p className="text-xs mt-1">{name}</p>
      </div>
    ))}
  </div>
);
```

## Troubleshooting

### Icon Not Showing
1. Check if it's exported from `@/components/icons`
2. Verify the import name matches the export
3. Check for CSS issues (color, size)

### TypeScript Errors
```tsx
// Ensure proper types
import type { LucideIcon } from 'lucide-react';
const MyIcon: LucideIcon = Heart;
```

### Bundle Size Issues
1. Run `pnpm analyze`
2. Check for duplicate icon imports
3. Consider lazy loading for rarely used icons

## Do's and Don'ts

### Do's ✅
- Use `@/components/icons` for all imports
- Add new icons to central exports immediately
- Keep icon names consistent with lucide-react
- Update old imports when modifying files
- Test icon rendering after changes

### Don'ts ❌
- Import directly from `lucide-react` in new code
- Create duplicate icon exports
- Change icon names arbitrarily
- Add heavy custom icons without lazy loading
- Ignore TypeScript errors

## Future Considerations

### When to Revisit This Strategy
- If bundle size exceeds 100KB for icons alone
- If we need more than 150 unique icons
- If performance metrics show icon-related issues
- If we want to implement custom icon design system

### Potential Future Optimizations
1. **Icon Sprite System**: For better performance
2. **SVG Symbol Maps**: For reduced DOM nodes
3. **Custom Icon Font**: For specific Hockey Hub icons
4. **Dynamic Icon Loading**: Based on user roles

## Quick Reference

```tsx
// Always do this
import { Heart, User, Settings } from '@/components/icons';

// Never do this
import { Heart } from 'lucide-react';

// Adding new icon
// 1. Add to components/icons/index.tsx
// 2. Use in your component
// 3. Commit with proper message
```

---

**Last Updated**: January 2025  
**Maintainer**: Physical Trainer Team  
**Review Schedule**: Quarterly