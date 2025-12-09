# Icon Migration Guide: lucide-react to Custom Icons

This guide helps you migrate from `lucide-react` to our custom icon system.

## Why Migrate?

- **Better Performance**: Tree-shakeable icons reduce bundle size
- **Sprite Support**: Optional sprite system for better performance with many icons
- **Consistency**: All icons use the same optimized SVG paths
- **Type Safety**: Full TypeScript support with proper types
- **Same API**: Drop-in replacement with the same props

## Migration Steps

### 1. Update Imports

Replace lucide-react imports with our custom icons:

```tsx
// Before
import { Plus, Save, Edit, Trash2 } from 'lucide-react';

// After
import { Plus, Save, Edit, Trash2 } from '@/components/icons';
```

### 2. Props are the Same

Our icons accept the same props as lucide-react:

```tsx
// Both work the same way
<Plus size={20} color="blue" className="mr-2" />
<Save size={24} className="text-green-500" />
```

### 3. Available Icons

Currently implemented icons:
- `Plus` - Add/Create actions
- `Save` - Save actions
- `Edit` - Edit/Modify actions
- `Trash2` - Delete actions
- `Download` - Download actions
- `Upload` - Upload actions
- `CheckCircle` - Success states
- `AlertCircle` - Warning/Error states
- `ChevronDown` - Expand/Show more
- `ChevronUp` - Collapse/Show less

### 4. Using Icon Sprites (Optional)

For better performance with many icons, use the sprite system:

```tsx
// Add IconSprite to your root layout
import { IconSprite } from '@/components/icons';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}

// Then use SpriteIcon component
import { SpriteIcon } from '@/components/icons';

<SpriteIcon name="plus" size={24} className="text-blue-500" />
<SpriteIcon name="save" size={20} />
```

## Examples

### Basic Usage

```tsx
import { Plus, Save, Edit, Trash2 } from '@/components/icons';

function MyComponent() {
  return (
    <div>
      <button>
        <Plus size={16} className="mr-1" />
        Add Item
      </button>
      
      <button>
        <Save size={20} color="green" />
        Save
      </button>
      
      <button>
        <Edit size={24} />
        Edit
      </button>
      
      <button>
        <Trash2 size={16} className="text-red-500" />
        Delete
      </button>
    </div>
  );
}
```

### With Tailwind CSS

```tsx
import { CheckCircle, AlertCircle } from '@/components/icons';

// Success message
<div className="flex items-center text-green-600">
  <CheckCircle className="w-5 h-5 mr-2" />
  Successfully saved!
</div>

// Error message
<div className="flex items-center text-red-600">
  <AlertCircle className="w-5 h-5 mr-2" />
  An error occurred
</div>
```

### Dropdown Example

```tsx
import { ChevronDown, ChevronUp } from '@/components/icons';

function Dropdown({ isOpen }) {
  return (
    <button className="flex items-center">
      Options
      {isOpen ? (
        <ChevronUp className="w-4 h-4 ml-1" />
      ) : (
        <ChevronDown className="w-4 h-4 ml-1" />
      )}
    </button>
  );
}
```

## Adding New Icons

To add a new icon:

1. Create a new file in `src/components/icons/` (e.g., `Star.tsx`)
2. Use the Icon base component:

```tsx
import React from 'react';
import { Icon, IconProps } from './Icon';

export const Star: React.FC<IconProps> = (props) => (
  <Icon {...props}>
    {/* Add SVG path elements here */}
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
);
```

3. Export it from `index.ts`
4. Add it to the sprite in `IconSprite.tsx` if using sprites

## TypeScript Support

All icons are fully typed:

```tsx
import { IconProps } from '@/components/icons';

interface ButtonProps {
  icon: React.FC<IconProps>;
  iconSize?: 16 | 20 | 24;
}

function IconButton({ icon: Icon, iconSize = 20 }: ButtonProps) {
  return (
    <button>
      <Icon size={iconSize} />
    </button>
  );
}
```

## Performance Tips

1. **Import only what you need**: Icons are tree-shakeable
   ```tsx
   // Good - only imports what's needed
   import { Plus, Save } from '@/components/icons';
   
   // Avoid - imports everything
   import * as Icons from '@/components/icons';
   ```

2. **Use sprites for many icons**: If you have 20+ icons on a page, consider using the sprite system

3. **Consistent sizing**: Use the predefined sizes (16, 20, 24) for better performance

## Troubleshooting

### Icon not showing?
- Check the import path is correct
- Ensure the icon name matches (case-sensitive)
- Verify the color isn't matching the background

### Wrong size?
- Use the `size` prop, not `width`/`height`
- For Tailwind, use `w-*` and `h-*` classes together

### Need a lucide icon that's not implemented?
- Check lucide-react's GitHub for the SVG paths
- Create a new icon component following the pattern above
- Submit a PR or request the icon be added