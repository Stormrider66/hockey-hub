# Tactical Play Export System

A comprehensive PDF export and sharing system for Ice Coach tactical features that allows coaches to export their plays as printable documents and shareable links.

## Overview

The export system provides coaches with powerful tools to:
- Export individual plays as high-quality PDFs
- Create complete playbooks with multiple plays
- Generate shareable links with customizable permissions
- Create QR codes for mobile access
- Support various export formats and quality settings

## Components

### Core Components

#### 1. ExportManager (`ExportManager.tsx`)
The main component that provides a comprehensive export interface with:
- **Multi-format export**: PDF, PNG, SVG (planned)
- **Quality settings**: Low, Medium, High, Ultra
- **Layout options**: A4, Letter, Legal, A3 with portrait/landscape
- **Color modes**: Full color, grayscale, black & white
- **Content options**: Metadata, notes, animation frames, branding
- **Sharing features**: Links, passwords, QR codes, expiration settings

#### 2. PDF Generator (`utils/pdfGenerator.ts`)
Advanced PDF generation utility with:
- **Professional layouts**: Automatic page formatting and styling
- **Table of contents**: For multi-play playbooks
- **Watermarks**: Custom text overlays for confidentiality
- **Statistics reports**: Playbook analytics and breakdowns
- **Play comparisons**: Side-by-side analysis documents
- **Branding support**: Team logos, coach names, organizations

#### 3. Image Processor (`utils/imageProcessor.ts`)
Handles tactical board image processing:
- **Color conversion**: Grayscale and black/white for printing
- **Quality scaling**: Multiple resolution outputs
- **Print enhancement**: Contrast and clarity optimization
- **Thumbnails**: Small preview generation
- **Watermarking**: Image-based security
- **Animation frames**: Sequence generation for animated plays
- **Grid layouts**: Multiple plays in single image

#### 4. QR Code Generator (`utils/qrGenerator.ts`)
Creates QR codes for mobile access:
- **Share links**: Standard web URLs
- **Deep links**: Direct app integration
- **Print versions**: High-contrast for documents
- **Analytics tracking**: Usage monitoring
- **Logo embedding**: Branded QR codes
- **Batch generation**: Multiple codes at once

#### 5. Share Manager (`utils/shareManager.ts`)
Comprehensive sharing system:
- **Link generation**: Secure, expiring URLs
- **Permission control**: View, download, comment rights
- **Team sharing**: Direct notifications to members
- **Social integration**: Twitter, Facebook, LinkedIn sharing
- **Embed codes**: Website integration
- **Analytics**: View tracking and demographics
- **One-time links**: Security-focused sharing

## Features

### Export Options

#### Formats
- **PDF**: Professional documents with full layout control
- **PNG**: High-quality images for presentations
- **SVG**: Vector graphics for scalable printing
- **DOCX**: Word documents (planned)

#### Quality Levels
- **Low (Fast)**: 0.5x scale, optimized for speed
- **Medium**: 1x scale, balanced quality/size
- **High (Recommended)**: 1.5x scale, excellent quality
- **Ultra (Slow)**: 2x scale, maximum quality

#### Page Layouts
- **A4**: 210 × 297 mm (European standard)
- **Letter**: 8.5 × 11 inches (US standard)
- **Legal**: 8.5 × 14 inches (US legal)
- **A3**: 297 × 420 mm (Large format)

#### Color Modes
- **Full Color**: Original tactical board colors
- **Grayscale**: Print-friendly monochrome
- **Black & White**: High-contrast printing

### Content Options

#### Metadata Inclusion
- Play name and description
- Category and formation
- Situation and tags
- Creation and modification dates
- Coach and team information

#### Coach Notes
- Detailed play descriptions
- Key coaching points
- Tactical variations
- Practice instructions

#### Branding
- Team logos and colors
- Coach and organization names
- Custom watermarks
- Professional headers/footers

### Sharing Features

#### Link Options
- **Expiration**: 1 hour to never expires
- **Password protection**: Secure access
- **Download permissions**: Control file access
- **Comment system**: Collaborative feedback
- **QR codes**: Mobile-friendly access

#### Team Integration
- Direct member notifications
- Role-based permissions
- Bulk sharing operations
- Activity tracking

#### Social Sharing
- Twitter, Facebook, LinkedIn
- Email and messaging apps
- Embed codes for websites
- Custom preview images

## Usage

### Basic Export

```tsx
import ExportManager from './ExportManager';

function TacticalBoard() {
  const [showExport, setShowExport] = useState(false);
  const tacticalBoardRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div ref={tacticalBoardRef}>
        {/* Tactical board content */}
      </div>
      
      <Button onClick={() => setShowExport(true)}>
        Export Play
      </Button>

      <ExportManager
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        playSystem={currentPlay}
        playSystems={allPlays}
        tacticalBoardRef={tacticalBoardRef}
        onExportComplete={(data) => {
          console.log('Export completed:', data);
        }}
      />
    </div>
  );
}
```

### Advanced PDF Generation

```tsx
import PDFGenerator from './utils/pdfGenerator';

async function generateCustomPlaybook() {
  const options = {
    pageSize: 'A4' as const,
    orientation: 'landscape' as const,
    includeMetadata: true,
    includeNotes: true,
    includeBranding: true,
    customBranding: {
      teamName: 'Boston Bruins',
      coachName: 'John Doe',
      organizationName: 'NHL'
    },
    tableOfContents: true,
    watermark: 'CONFIDENTIAL'
  };

  const generator = new PDFGenerator(options);
  const pdfData = await generator.generatePlaybook(plays, images);
  
  // Convert to blob and download
  const blob = new Blob([pdfData], { type: 'application/pdf' });
  saveAs(blob, 'playbook.pdf');
}
```

### Image Processing

```tsx
import ImageProcessor from './utils/imageProcessor';

async function processImage(originalImage: string) {
  // Convert to print-friendly black and white
  const bwImage = await ImageProcessor.processImage(
    originalImage, 
    'blackwhite', 
    'high'
  );

  // Add watermark
  const watermarked = await ImageProcessor.addWatermark(
    bwImage,
    'DRAFT',
    0.3
  );

  // Create thumbnail
  const thumbnail = await ImageProcessor.createThumbnail(
    watermarked,
    200,
    150
  );

  return { processed: watermarked, thumbnail };
}
```

### Share Link Creation

```tsx
import ShareManager from './utils/shareManager';

async function sharePlay(play: PlaySystem) {
  const shareData = {
    playId: play.id,
    playName: play.name,
    teamId: 'team-123',
    shareOptions: {
      generateLink: true,
      linkExpiration: '7days' as const,
      passwordProtected: false,
      allowDownload: true,
      allowComments: true,
      includeQRCode: true
    }
  };

  const shareLink = await ShareManager.createShareLink(shareData);
  
  // Copy to clipboard
  await ShareManager.copyToClipboard(shareLink.url);
  
  // Generate social sharing URLs
  const socialLinks = ShareManager.generateSocialShares(
    shareLink, 
    play.name
  );
}
```

## Integration Points

### PlaySystemEditor Integration

The ExportManager is integrated into the PlaySystemEditor component:

1. **Header Export Button**: Global export access
2. **Side Panel Export**: Context-specific export
3. **Library Card Exports**: Individual play exports
4. **Batch Operations**: Multiple play selection

### Tactical Board Integration

The system captures the tactical board canvas using:

1. **HTML5 Canvas**: Direct pixel capture
2. **html2canvas**: DOM-to-image conversion
3. **Quality Scaling**: Resolution optimization
4. **Format Conversion**: Multiple output types

## File Structure

```
tactical/
├── ExportManager.tsx          # Main export interface
├── utils/
│   ├── pdfGenerator.ts        # PDF creation utilities
│   ├── imageProcessor.ts      # Image manipulation
│   ├── qrGenerator.ts         # QR code generation
│   └── shareManager.ts        # Sharing functionality
├── PlaySystemEditor.tsx       # Integration point
├── TacticalBoard2D.tsx        # Canvas source
└── EXPORT-README.md          # This documentation
```

## Dependencies

### Required Packages
- `jspdf`: PDF document creation
- `jspdf-autotable`: Table generation for PDFs
- `html2canvas`: DOM to canvas conversion
- `file-saver`: File download functionality

### Optional Enhancements
- `qrcode`: Professional QR code generation
- `canvas`: Server-side image processing
- `sharp`: Advanced image manipulation
- `puppeteer`: Server-side PDF generation

## Configuration

### Environment Variables

```env
# Sharing service configuration
NEXT_PUBLIC_SHARE_BASE_URL=https://hockeyhub.app/shared
NEXT_PUBLIC_API_BASE_URL=https://api.hockeyhub.app

# Feature flags
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_SHARING=true
NEXT_PUBLIC_ENABLE_QR_CODES=true

# Limits
NEXT_PUBLIC_MAX_EXPORT_SIZE=50MB
NEXT_PUBLIC_MAX_SHARE_DURATION=30days
```

### Default Settings

```tsx
const DEFAULT_EXPORT_OPTIONS = {
  format: 'pdf' as const,
  quality: 'high' as const,
  pageSize: 'A4' as const,
  orientation: 'landscape' as const,
  colorMode: 'color' as const,
  includeMetadata: true,
  includeNotes: true,
  includeBranding: true,
  pageNumbers: true,
  compression: true
};
```

## Security Considerations

### Shared Links
- Secure random ID generation (16+ characters)
- Optional password protection
- Configurable expiration times
- Access logging and monitoring
- Rate limiting for abuse prevention

### Data Privacy
- No sensitive data in URLs
- Encrypted storage for shared content
- GDPR compliance for user data
- Option to disable sharing features

### File Security
- Virus scanning for uploads
- Size limits for exports
- Content validation
- Secure temporary file handling

## Performance Optimization

### Image Processing
- Canvas-based processing for speed
- Web Workers for heavy operations
- Image quality vs. size balancing
- Caching of processed images

### PDF Generation
- Streaming generation for large documents
- Memory management for multiple plays
- Compression optimization
- Progress tracking for user feedback

### Sharing System
- CDN distribution for shared links
- Caching for frequently accessed content
- Database indexing for quick lookups
- Background processing for heavy operations

## Future Enhancements

### Planned Features
1. **Video Export**: MP4 animation export
2. **PowerPoint Export**: Presentation format
3. **Interactive PDFs**: Clickable elements
4. **Batch Processing**: Server-side generation
5. **API Integration**: Third-party exports
6. **Template System**: Custom layouts
7. **Version Control**: Export history
8. **Collaborative Editing**: Real-time sharing

### Technical Improvements
1. **WebAssembly**: Faster processing
2. **Service Workers**: Offline exports
3. **Progressive Download**: Streaming PDFs
4. **Machine Learning**: Auto-optimization
5. **Cloud Storage**: Scalable file hosting

## Troubleshooting

### Common Issues

#### Export Fails
- Check browser permissions for downloads
- Verify canvas content is captured
- Ensure sufficient memory for large exports
- Try lower quality settings

#### Sharing Links Don't Work
- Verify API endpoints are accessible
- Check expiration dates
- Confirm password requirements
- Test network connectivity

#### PDF Quality Issues
- Increase quality setting
- Check source image resolution
- Verify color mode settings
- Try different page sizes

#### Performance Problems
- Reduce export quality for speed
- Process fewer plays at once
- Close unnecessary browser tabs
- Use Web Workers for heavy processing

### Debug Information

Enable debug logging:

```tsx
// In development
const DEBUG_EXPORT = process.env.NODE_ENV === 'development';

if (DEBUG_EXPORT) {
  console.log('Export options:', exportOptions);
  console.log('Processing images:', imageData.length);
  console.log('PDF generation time:', processingTime);
}
```

## Support

For technical support or feature requests:
- GitHub Issues: Link to repository issues
- Documentation: Internal wiki or docs
- Team Chat: Slack or Teams channel
- Email Support: Technical team contact

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Hockey Hub Development Team