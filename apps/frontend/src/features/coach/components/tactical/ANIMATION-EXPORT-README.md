# Animation Export System for Ice Coach Tactical Features

## Overview

The Hockey Hub Animation Export System provides comprehensive export capabilities for animated tactical plays, allowing coaches to create professional GIFs and videos of their play diagrams for sharing, presentation, and training purposes.

## Features

### 🎬 Export Formats
- **Animated GIF**: Optimized for social media and web sharing
- **MP4 Video**: High-quality video format for presentations
- **WebM Video**: Web-optimized format for online platforms
- **PNG Sequence**: Individual frames exported as a ZIP archive

### 📱 Social Media Presets
- **Instagram Story** (9:16, 1080x1920)
- **Instagram Post** (1:1, 1080x1080) 
- **Instagram Reel** (9:16, 1080x1920)
- **TikTok** (9:16, 1080x1920)
- **Twitter** (16:9, 1280x720)
- **WhatsApp/Telegram** (16:9, optimized for messaging)
- **Presentation** (16:9, 1920x1080, high quality)
- **Email** (16:9, 854x480, small file size)

### ⚙️ Customization Options

#### GIF Settings
- Frame rate: 15-60 FPS
- Quality: 1-100%
- Loop count: Infinite, once, or custom
- Color palette: 64-256 colors
- Dithering for better color reproduction

#### Video Settings
- Codec options: H.264, H.265/HEVC, VP8, VP9
- Bitrate: 500 kbps - 8 Mbps
- Frame rate: 24-60 FPS
- Audio narration support (future feature)
- Fade in/out effects

#### Visual Overlays
- Play title with customizable font and positioning
- Team branding and logo integration
- Coach/team name watermarks
- Timestamp display
- Custom watermark text and positioning

### 🚀 Performance Features
- **Background Processing**: Non-blocking export with Web Workers
- **Frame Caching**: Optimized memory usage for long animations
- **Progress Tracking**: Real-time export progress with time estimates
- **Memory Management**: Automatic cleanup and optimization
- **Cancellation Support**: Ability to cancel long-running exports

## Technical Architecture

### Core Components

1. **AnimationExporter.ts**
   - Main export engine with format-specific handlers
   - Frame capture and processing pipeline
   - Memory optimization and performance monitoring

2. **ExportManager.tsx** (Enhanced)
   - UI integration for animation export options
   - Social media preset selection
   - Real-time progress display

3. **AnimationEngine.ts** (Integration)
   - Provides animation playback and frame data
   - Keyframe interpolation for smooth export
   - Timeline control for frame capture

### Export Pipeline

1. **Validation**: Check animation engine and canvas availability
2. **Configuration**: Apply presets and user settings
3. **Frame Capture**: Extract frames from Pixi.js canvas at specified intervals
4. **Processing**: Apply overlays, branding, and effects
5. **Encoding**: Generate final export file (GIF/MP4/WebM)
6. **Download**: Provide file to user with appropriate filename

### Dependencies

```bash
# Required libraries (to be added to package.json)
npm install gif.js          # GIF creation
npm install ffmpeg.wasm     # Video encoding (future)
npm install jszip           # ZIP file creation for PNG sequences
```

## Usage Examples

### Basic GIF Export
```typescript
import AnimationExporter, { getOptimalExportSettings } from './AnimationExporter';

const exporter = new AnimationExporter();
const config = getOptimalExportSettings('social');

const result = await exporter.exportAnimation(
  animationEngine,
  canvasElement,
  {
    ...config,
    format: 'gif',
    socialPreset: 'instagram-post'
  }
);

if (result.success) {
  downloadFile(result.blob, result.fileName);
}
```

### Professional Video Export
```typescript
const config = {
  format: 'mp4',
  socialPreset: 'presentation',
  videoOptions: {
    frameRate: 30,
    bitrate: 5000,
    codec: 'h264'
  },
  overlayOptions: {
    includeTitle: true,
    includeBranding: true,
    coachName: 'Coach Smith',
    teamName: 'Rangers U18'
  }
};

const result = await exporter.exportAnimation(
  animationEngine,
  canvasElement,
  config
);
```

### Progress Monitoring
```typescript
exporter.on('progressUpdate', (progress) => {
  console.log(`${progress.stage}: ${progress.progress}%`);
  console.log(`Frame ${progress.currentFrame}/${progress.totalFrames}`);
  console.log(`ETA: ${progress.estimatedTimeRemaining}s`);
});

exporter.on('exportComplete', (result) => {
  console.log(`Export completed: ${result.fileName}`);
  console.log(`File size: ${result.fileSizeBytes} bytes`);
  console.log(`Export took: ${result.exportDuration}s`);
});
```

## Integration with Existing System

### ExportManager Updates
- New animation format options in dropdown
- Social media preset selector
- Animation-specific settings panel
- Enhanced progress display for long exports

### Required Props
```typescript
interface ExportManagerProps {
  // Existing props...
  animationEngine?: AnimationEngine;  // For animation playback
  canvasElement?: HTMLCanvasElement;  // For frame capture
}
```

### Canvas Requirements
- Must be a `<canvas>` element rendered by Pixi.js
- Should contain the current frame of tactical play
- Animation engine controls playback for frame capture

## Performance Considerations

### Memory Management
- Frame caching limited to prevent memory overflow
- Automatic cleanup after export completion
- Warning system for large file exports

### Export Time Estimates
- **15-second play @ 30 FPS**: ~2-5 seconds
- **30-second play @ 60 FPS**: ~8-15 seconds
- **Large presentation export**: ~20-60 seconds

### File Size Guidelines
- **GIF (Instagram)**: 1-5 MB typical
- **MP4 (2 Mbps)**: 500 KB - 2 MB per 10 seconds
- **High-quality presentation**: 5-20 MB

## Browser Compatibility

### Supported Features
- ✅ Chrome/Edge: Full support including video export
- ✅ Firefox: Full support with WebM preference
- ✅ Safari: GIF and basic video (H.264 only)
- ⚠️ Mobile browsers: Limited by memory constraints

### Fallbacks
- Automatic codec selection based on browser support
- Quality reduction for memory-constrained devices
- PNG sequence export as universal fallback

## Future Enhancements

### Planned Features
- **Audio Narration**: Coach voiceover during export
- **Advanced Transitions**: Fade, slide, and zoom effects
- **Batch Export**: Multiple plays in single video
- **Cloud Processing**: Server-side export for large files
- **Live Streaming**: Real-time tactical drawing broadcast

### Technical Improvements
- Web Worker implementation for true background processing
- WebAssembly video encoding for better performance
- Progressive download for large exports
- Export queue management for multiple simultaneous exports

## Troubleshooting

### Common Issues
1. **"Animation engine not available"**
   - Ensure AnimationEngine is loaded with a tactical play
   - Check that canvas element reference is valid

2. **"Export failed: Memory limit exceeded"**
   - Reduce frame rate or export quality
   - Try shorter play duration
   - Clear browser cache and reload

3. **"Video export not supported"**
   - Check browser compatibility
   - Try GIF export as alternative
   - Update to latest browser version

### Debug Mode
```typescript
const exporter = new AnimationExporter();
exporter.on('memoryWarning', (data) => {
  console.warn('Memory usage high:', data);
});

exporter.on('qualityAdjusted', (adjustment) => {
  console.log('Quality automatically adjusted:', adjustment);
});
```

## Contributing

When adding new export formats or features:

1. Extend the `ExportFormat` type
2. Add format-specific options to configuration interfaces
3. Implement export handler in `AnimationExporter`
4. Update UI components in `ExportManager`
5. Add corresponding social media presets
6. Update documentation and examples

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintainer**: Hockey Hub Development Team