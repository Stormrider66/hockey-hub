# Image Optimization System

This directory contains the Hockey Hub image optimization system built on Next.js Image component with additional features for performance, loading states, and error handling.

## Components

### OptimizedImage
The main image component that wraps Next.js Image with additional features:
- Automatic format conversion (WebP, AVIF)
- Built-in loading skeleton
- Error handling with fallback images
- Blur placeholder support
- Lazy loading by default

```tsx
import { OptimizedImage } from '@/components/ui/image';

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // For above-the-fold images
/>
```

### Avatar
Specialized component for user avatars with preset sizes:

```tsx
import { Avatar } from '@/components/ui/image';

<Avatar 
  src={user.photo} 
  alt={user.name}
  size="md" // sm | md | lg | xl
/>
```

### TeamLogo
Specialized component for team logos:

```tsx
import { TeamLogo } from '@/components/ui/image';

<TeamLogo 
  src={team.logo} 
  alt={team.name}
  size="md" // sm | md | lg
/>
```

### HeroImage
For full-width hero/banner images:

```tsx
import { HeroImage } from '@/components/ui/image';

<div className="relative h-96">
  <HeroImage
    src="/hero.jpg"
    alt="Hero banner"
    priority
  />
</div>
```

### DynamicImage
For handling dynamic sources (File, Blob, data URLs):

```tsx
import { DynamicImage } from '@/components/ui/image';

<DynamicImage
  src={file} // File, Blob, or URL
  alt="Dynamic image"
  width={200}
  height={200}
/>
```

## Hooks

### useImageOptimization
Generate placeholders and optimize images:

```tsx
const { blurDataURL, dominantColor, isLoading } = useImageOptimization(src, {
  generateBlur: true,
  extractColor: true,
});
```

### useImagePreloader
Batch preload multiple images:

```tsx
const { preload, isLoading, progress } = useImagePreloader();

await preload(['/image1.jpg', '/image2.jpg']);
```

### useResponsiveImage
Calculate responsive image dimensions:

```tsx
const { getResponsiveSize, getSizes } = useResponsiveImage(1920, 1080);

const { width, height } = getResponsiveSize(maxWidth);
```

## Configuration

### next.config.js
The following configuration is already set up:

```js
images: {
  formats: ['image/avif', 'image/webp'],
  domains: ['localhost'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

### Folder Structure
```
public/
└── images/
    ├── default/       # Fallback images
    ├── avatars/       # User avatars
    ├── teams/         # Team logos
    ├── logos/         # Brand logos
    ├── hero/          # Hero images
    ├── thumbnails/    # Thumbnails
    └── icons/         # Icon images
```

## Migration Guide

### From `<img>` to `<OptimizedImage>`

Before:
```tsx
<img src="/image.jpg" alt="Description" className="w-full" />
```

After:
```tsx
<OptimizedImage 
  src="/image.jpg" 
  alt="Description" 
  width={800} 
  height={600}
  className="w-full"
/>
```

### Run Migration Script
```bash
# Dry run to see changes
node scripts/migrate-images.js --dry-run

# Apply changes
node scripts/migrate-images.js
```

## Best Practices

1. **Always specify dimensions**: Provide width and height to prevent layout shift
2. **Use priority for above-the-fold**: Add `priority` prop for hero images
3. **Optimize sizes prop**: Configure responsive breakpoints
4. **External images**: Add domains to next.config.js
5. **Use specialized components**: Avatar, TeamLogo for consistent styling
6. **Generate placeholders**: Use blur placeholders for better UX
7. **Lazy load by default**: Only disable for critical images

## Performance Tips

1. **Image Formats**: Next.js automatically serves WebP/AVIF when supported
2. **Sizing**: Use the `sizes` prop for responsive images
3. **Caching**: Images are cached with 60s minimum TTL
4. **Preloading**: Use `priority` or `useImagePreloader` for critical images
5. **Placeholders**: Generate blur data URLs for smooth loading

## Troubleshooting

### External Images Not Loading
Add the domain to `next.config.js`:
```js
images: {
  domains: ['example.com'],
}
```

### Layout Shift
Always provide width and height dimensions or use `fill` with a container.

### Blur Placeholder Not Showing
Generate blur data URL using the utility:
```tsx
const blurDataURL = await generateBlurDataURL(src);
```

### Dynamic Images Not Optimizing
Use `DynamicImage` component for File/Blob sources.