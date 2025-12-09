import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

// Export format types
export type ExportFormat = 'pdf' | 'png' | 'svg' | 'docx' | 'zip';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ExportTemplate = 'practice-plan' | 'game-analysis' | 'player-development' | 'playbook' | 'custom';
export type PageSize = 'A4' | 'Letter' | 'Legal' | 'A3';
export type Orientation = 'portrait' | 'landscape';
export type ColorMode = 'color' | 'grayscale' | 'blackwhite';

// Play system interface
export interface PlaySystem {
  id: string;
  name: string;
  description: string;
  category: 'offensive' | 'defensive' | 'special-teams' | 'faceoff' | 'transition';
  situation: string;
  formation: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  coachNotes?: string;
  keyPoints?: string[];
  variations?: PlayVariation[];
  effectiveness?: number; // 0-100
  successRate?: number; // 0-100
  usageFrequency?: number;
  playerPositions?: PlayerPosition[];
  videoClips?: VideoClip[];
  screenshots?: string[];
}

export interface PlayVariation {
  id: string;
  name: string;
  description: string;
  data: any;
  effectiveness?: number;
  notes?: string;
}

export interface PlayerPosition {
  playerId: string;
  playerName: string;
  position: string;
  role: string;
  instructions?: string;
}

export interface VideoClip {
  id: string;
  url: string;
  thumbnail: string;
  startTime: number;
  endTime: number;
  description?: string;
}

// Enhanced export options
export interface ExportOptions {
  format: ExportFormat;
  template: ExportTemplate;
  quality: ExportQuality;
  pageSize: PageSize;
  orientation: Orientation;
  colorMode: ColorMode;
  
  // Content options
  includeMetadata: boolean;
  includeNotes: boolean;
  includeStatistics: boolean;
  includePlayerInstructions: boolean;
  includeVideoScreenshots: boolean;
  includeAnimationFrames: boolean;
  includeDiagrams: boolean;
  includeAnalytics: boolean;
  
  // Branding options
  includeBranding: boolean;
  customBranding?: BrandingOptions;
  watermark?: string;
  headerLogo?: string;
  footerText?: string;
  
  // Layout options
  pageNumbers: boolean;
  tableOfContents: boolean;
  coverPage: boolean;
  sectionDividers: boolean;
  playIndex: boolean;
  
  // PDF specific
  compression: boolean;
  password?: string;
  permissions?: PDFPermissions;
  
  // Advanced options
  batchExport: boolean;
  customSections?: CustomSection[];
  templateCustomization?: TemplateCustomization;
}

export interface BrandingOptions {
  teamLogo?: string;
  coachName?: string;
  teamName?: string;
  organizationName?: string;
  season?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  fonts?: {
    heading: string;
    body: string;
  };
}

export interface PDFPermissions {
  print: boolean;
  modify: boolean;
  copy: boolean;
  annotate: boolean;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  position: 'before-plays' | 'after-plays' | 'appendix';
  includePageBreak?: boolean;
}

export interface TemplateCustomization {
  headerStyle?: 'minimal' | 'standard' | 'detailed';
  layoutStyle?: 'compact' | 'standard' | 'spacious';
  colorScheme?: 'default' | 'monochrome' | 'team-colors' | 'custom';
  diagramSize?: 'small' | 'medium' | 'large';
  fontSizes?: {
    title: number;
    heading: number;
    body: number;
    caption: number;
  };
}

// Export progress tracking
export interface ExportProgress {
  stage: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
  message: string;
  timeRemaining?: number;
  fileSize?: number;
}

// Export result
export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  blob?: Blob;
  downloadUrl?: string;
  shareUrl?: string;
  qrCode?: string;
  error?: string;
  metadata?: ExportMetadata;
}

export interface ExportMetadata {
  exportTime: Date;
  playsCount: number;
  pagesCount?: number;
  template: ExportTemplate;
  format: ExportFormat;
  quality: ExportQuality;
  processingTime: number;
  options: ExportOptions;
}

// Enhanced PDF Export Service
export class EnhancedExportService {
  private pdf: jsPDF;
  private options: ExportOptions;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentPage: number = 1;
  private progressCallback?: (progress: ExportProgress) => void;
  private startTime: number = 0;

  constructor(options: ExportOptions, progressCallback?: (progress: ExportProgress) => void) {
    this.options = options;
    this.progressCallback = progressCallback;
    this.initializePDF();
  }

  private initializePDF() {
    this.pdf = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize.toLowerCase() as any,
      compress: this.options.compression
    });
    
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();

    // Set PDF security if password is provided
    if (this.options.password || this.options.permissions) {
      this.setPDFSecurity();
    }
  }

  private setPDFSecurity() {
    // Note: jsPDF doesn't support encryption out of the box
    // This would require additional libraries like pdf-lib
    console.warn('PDF security features require additional implementation');
  }

  private updateProgress(stage: string, currentStep: number, totalSteps: number, message: string) {
    if (this.progressCallback) {
      const progress = (currentStep / totalSteps) * 100;
      const timeElapsed = Date.now() - this.startTime;
      const timeRemaining = currentStep > 0 ? (timeElapsed / currentStep) * (totalSteps - currentStep) : undefined;

      this.progressCallback({
        stage,
        currentStep,
        totalSteps,
        progress,
        message,
        timeRemaining
      });
    }
  }

  // Main export function
  async exportPlays(
    plays: PlaySystem[],
    canvasElements?: HTMLElement[],
    additionalData?: any
  ): Promise<ExportResult> {
    this.startTime = Date.now();
    
    try {
      this.updateProgress('Initializing', 0, 10, 'Setting up export...');

      // Calculate total steps based on options
      const totalSteps = this.calculateTotalSteps(plays);
      let currentStep = 0;

      // Step 1: Capture diagrams/screenshots
      this.updateProgress('Capture', ++currentStep, totalSteps, 'Capturing tactical diagrams...');
      const capturedImages = await this.captureElements(canvasElements || []);

      // Step 2: Process images based on color mode
      this.updateProgress('Process', ++currentStep, totalSteps, 'Processing images...');
      const processedImages = await this.processImages(capturedImages);

      // Step 3: Generate cover page if enabled
      if (this.options.coverPage) {
        this.updateProgress('Cover', ++currentStep, totalSteps, 'Creating cover page...');
        await this.generateCoverPage(plays.length);
      }

      // Step 4: Generate table of contents if enabled
      if (this.options.tableOfContents) {
        this.updateProgress('TOC', ++currentStep, totalSteps, 'Creating table of contents...');
        this.generateTableOfContents(plays);
      }

      // Step 5: Add custom sections (before plays)
      if (this.options.customSections) {
        const beforeSections = this.options.customSections.filter(s => s.position === 'before-plays');
        for (const section of beforeSections) {
          this.updateProgress('Sections', ++currentStep, totalSteps, `Adding section: ${section.title}`);
          this.addCustomSection(section);
        }
      }

      // Step 6: Generate play pages
      for (let i = 0; i < plays.length; i++) {
        this.updateProgress('Plays', ++currentStep, totalSteps, `Generating play ${i + 1}/${plays.length}: ${plays[i].name}`);
        await this.addPlayPage(plays[i], processedImages[i], i);
      }

      // Step 7: Add custom sections (after plays)
      if (this.options.customSections) {
        const afterSections = this.options.customSections.filter(s => s.position === 'after-plays');
        for (const section of afterSections) {
          this.updateProgress('Sections', ++currentStep, totalSteps, `Adding section: ${section.title}`);
          this.addCustomSection(section);
        }
      }

      // Step 8: Generate analytics section if enabled
      if (this.options.includeAnalytics) {
        this.updateProgress('Analytics', ++currentStep, totalSteps, 'Generating analytics...');
        this.addAnalyticsSection(plays);
      }

      // Step 9: Add play index if enabled
      if (this.options.playIndex) {
        this.updateProgress('Index', ++currentStep, totalSteps, 'Creating play index...');
        this.generatePlayIndex(plays);
      }

      // Step 10: Add appendix sections
      if (this.options.customSections) {
        const appendixSections = this.options.customSections.filter(s => s.position === 'appendix');
        for (const section of appendixSections) {
          this.updateProgress('Appendix', ++currentStep, totalSteps, `Adding appendix: ${section.title}`);
          this.addCustomSection(section);
        }
      }

      // Step 11: Finalize PDF
      this.updateProgress('Finalize', ++currentStep, totalSteps, 'Finalizing document...');
      const pdfData = this.pdf.output('arraybuffer') as Uint8Array;
      const blob = new Blob([pdfData], { type: 'application/pdf' });

      this.updateProgress('Complete', totalSteps, totalSteps, 'Export completed successfully!');

      const fileName = this.generateFileName(plays);
      const processingTime = Date.now() - this.startTime;

      return {
        success: true,
        fileName,
        fileSize: blob.size,
        blob,
        metadata: {
          exportTime: new Date(),
          playsCount: plays.length,
          pagesCount: this.currentPage,
          template: this.options.template,
          format: this.options.format,
          quality: this.options.quality,
          processingTime,
          options: this.options
        }
      };

    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        fileName: '',
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private calculateTotalSteps(plays: PlaySystem[]): number {
    let steps = 2; // Initialize + Capture
    
    if (this.options.coverPage) steps++;
    if (this.options.tableOfContents) steps++;
    if (this.options.customSections) {
      steps += this.options.customSections.length;
    }
    
    steps += plays.length; // One step per play
    
    if (this.options.includeAnalytics) steps++;
    if (this.options.playIndex) steps++;
    
    steps++; // Finalize
    
    return steps;
  }

  private async captureElements(elements: HTMLElement[]): Promise<string[]> {
    const images: string[] = [];
    
    for (const element of elements) {
      try {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: this.getQualityScale(),
          useCORS: true,
          allowTaint: false,
          logging: false
        });
        images.push(canvas.toDataURL('image/png'));
      } catch (error) {
        console.error('Failed to capture element:', error);
        images.push(''); // Push empty string as placeholder
      }
    }
    
    return images;
  }

  private getQualityScale(): number {
    switch (this.options.quality) {
      case 'low': return 1;
      case 'medium': return 1.5;
      case 'high': return 2;
      case 'ultra': return 3;
      default: return 2;
    }
  }

  private async processImages(images: string[]): Promise<string[]> {
    if (this.options.colorMode === 'color') {
      return images;
    }
    
    // Process images for grayscale or black/white
    const processedImages: string[] = [];
    
    for (const imageData of images) {
      if (!imageData) {
        processedImages.push('');
        continue;
      }
      
      try {
        const processed = await this.processImage(imageData);
        processedImages.push(processed);
      } catch (error) {
        console.error('Failed to process image:', error);
        processedImages.push(imageData); // Fallback to original
      }
    }
    
    return processedImages;
  }

  private async processImage(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          
          if (this.options.colorMode === 'grayscale') {
            data[i] = data[i + 1] = data[i + 2] = gray;
          } else if (this.options.colorMode === 'blackwhite') {
            const bw = gray > 128 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = bw;
          }
        }
        
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageData;
    });
  }

  private async generateCoverPage(playsCount: number) {
    this.addWatermark();
    
    const branding = this.options.customBranding;
    let yPos = 60;
    
    // Header logo if provided
    if (branding?.teamLogo) {
      // Add logo (placeholder implementation)
      yPos += 30;
    }
    
    // Main title
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    const title = this.getTemplateTitle();
    this.pdf.text(title, this.pageWidth / 2, yPos, { align: 'center' });
    yPos += 25;
    
    // Team name
    if (branding?.teamName) {
      this.pdf.setFontSize(20);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(branding.teamName, this.pageWidth / 2, yPos, { align: 'center' });
      yPos += 20;
    }
    
    // Season
    if (branding?.season) {
      this.pdf.setFontSize(16);
      this.pdf.text(`Season: ${branding.season}`, this.pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
    }
    
    // Coach information
    if (branding?.coachName) {
      this.pdf.setFontSize(14);
      this.pdf.text(`Coach: ${branding.coachName}`, this.pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
    }
    
    // Document info box
    yPos = 140;
    const boxWidth = 100;
    const boxHeight = 60;
    const boxX = (this.pageWidth - boxWidth) / 2;
    
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(boxX, yPos, boxWidth, boxHeight, 'F');
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(boxX, yPos, boxWidth, boxHeight);
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Document Information', boxX + boxWidth/2, yPos + 15, { align: 'center' });
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Total Plays: ${playsCount}`, boxX + 5, yPos + 25);
    this.pdf.text(`Generated: ${new Date().toLocaleDateString()}`, boxX + 5, yPos + 35);
    this.pdf.text(`Template: ${this.options.template}`, boxX + 5, yPos + 45);
    this.pdf.text(`Format: ${this.options.format.toUpperCase()}`, boxX + 5, yPos + 55);
    
    this.addPageFooter();
  }

  private getTemplateTitle(): string {
    switch (this.options.template) {
      case 'practice-plan': return 'Practice Plan';
      case 'game-analysis': return 'Game Analysis';
      case 'player-development': return 'Player Development Guide';
      case 'playbook': return 'Hockey Playbook';
      case 'custom': return 'Tactical Manual';
      default: return 'Hockey Playbook';
    }
  }

  private generateTableOfContents(plays: PlaySystem[]) {
    this.addPage();
    this.addWatermark();
    
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Table of Contents', this.margin, 40);
    
    // Group plays by category for better organization
    const playsByCategory = plays.reduce((acc, play, index) => {
      if (!acc[play.category]) {
        acc[play.category] = [];
      }
      acc[play.category].push({ play, index });
      return acc;
    }, {} as Record<string, Array<{ play: PlaySystem; index: number }>>);
    
    const tableData: string[][] = [];
    let pageNum = this.options.coverPage ? 3 : 2; // Adjust for cover page
    
    Object.entries(playsByCategory).forEach(([category, categoryPlays]) => {
      // Add category header
      tableData.push([
        '',
        category.charAt(0).toUpperCase() + category.slice(1) + ' Plays',
        '',
        '',
        ''
      ]);
      
      // Add plays in category
      categoryPlays.forEach(({ play }) => {
        tableData.push([
          (tableData.length).toString(),
          play.name,
          play.formation || '-',
          play.tags.slice(0, 2).join(', ') || '-',
          pageNum.toString()
        ]);
        pageNum++;
      });
    });

    this.pdf.autoTable({
      startY: 60,
      head: [['#', 'Play Name', 'Formation', 'Tags', 'Page']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: this.getBrandingColor('primary', [41, 128, 185]),
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20 },
      },
    });
    
    this.addPageFooter();
  }

  private getBrandingColor(type: 'primary' | 'secondary', defaultColor: number[]): number[] {
    const colors = this.options.customBranding?.colors;
    if (!colors) return defaultColor;
    
    const colorStr = type === 'primary' ? colors.primary : colors.secondary;
    if (!colorStr) return defaultColor;
    
    // Convert hex to RGB (simplified implementation)
    const hex = colorStr.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return [r, g, b];
  }

  private async addPlayPage(play: PlaySystem, image: string, playIndex: number) {
    if (playIndex > 0 || this.currentPage > 1) {
      this.addPage();
    }
    
    this.addWatermark();
    
    let yPos = 30;
    const contentWidth = this.pageWidth - 2 * this.margin;
    
    // Play header section
    yPos = this.addPlayHeader(play, yPos);
    
    // Metadata section with enhanced info
    if (this.options.includeMetadata) {
      yPos = this.addEnhancedMetadataSection(play, yPos);
    }
    
    // Diagram section
    if (this.options.includeDiagrams && image) {
      yPos = this.addDiagramSection(image, yPos);
    }
    
    // Player instructions section
    if (this.options.includePlayerInstructions && play.playerPositions) {
      yPos = this.addPlayerInstructionsSection(play, yPos);
    }
    
    // Video screenshots section
    if (this.options.includeVideoScreenshots && play.screenshots) {
      yPos = this.addVideoScreenshotsSection(play, yPos);
    }
    
    // Notes and description section
    if (this.options.includeNotes) {
      yPos = this.addNotesSection(play, yPos);
    }
    
    // Statistics section
    if (this.options.includeStatistics) {
      yPos = this.addStatisticsSection(play, yPos);
    }
    
    this.addPageFooter();
  }

  private addPlayHeader(play: PlaySystem, startY: number): number {
    let yPos = startY;
    
    // Play name
    this.pdf.setFontSize(22);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(play.name, this.margin, yPos);
    yPos += 25;
    
    return yPos;
  }

  private addEnhancedMetadataSection(play: PlaySystem, startY: number): number {
    let yPos = startY;
    const contentWidth = this.pageWidth - 2 * this.margin;
    
    // Create metadata table
    const metadataData: string[][] = [
      ['Category', play.category.charAt(0).toUpperCase() + play.category.slice(1)],
      ['Formation', play.formation || 'Not specified'],
      ['Situation', play.situation || 'General'],
      ['Tags', play.tags.join(', ') || 'None'],
      ['Created', play.createdAt.toLocaleDateString()],
      ['Updated', play.updatedAt.toLocaleDateString()]
    ];
    
    // Add performance metrics if available
    if (play.effectiveness !== undefined) {
      metadataData.push(['Effectiveness', `${play.effectiveness}%`]);
    }
    if (play.successRate !== undefined) {
      metadataData.push(['Success Rate', `${play.successRate}%`]);
    }
    if (play.usageFrequency !== undefined) {
      metadataData.push(['Usage Frequency', play.usageFrequency.toString()]);
    }

    this.pdf.autoTable({
      startY: yPos,
      body: metadataData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { cellWidth: contentWidth - 30 },
      },
    });
    
    yPos = (this.pdf as any).lastAutoTable.finalY + 15;
    return yPos;
  }

  private addDiagramSection(image: string, startY: number): number {
    let yPos = startY;
    const contentWidth = this.pageWidth - 2 * this.margin;
    
    // Section title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Tactical Diagram', this.margin, yPos);
    yPos += 10;
    
    // Add diagram
    const diagramSize = this.getDiagramSize();
    const imgWidth = Math.min(contentWidth * 0.8, diagramSize.width);
    const imgHeight = (imgWidth * diagramSize.height) / diagramSize.width;
    
    const imgX = (this.pageWidth - imgWidth) / 2;
    
    this.pdf.addImage(image, 'PNG', imgX, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 15;
    
    return yPos;
  }

  private getDiagramSize(): { width: number; height: number } {
    const customization = this.options.templateCustomization;
    const size = customization?.diagramSize || 'medium';
    
    switch (size) {
      case 'small': return { width: 100, height: 60 };
      case 'medium': return { width: 140, height: 84 };
      case 'large': return { width: 180, height: 108 };
      default: return { width: 140, height: 84 };
    }
  }

  private addPlayerInstructionsSection(play: PlaySystem, startY: number): number {
    let yPos = startY;
    
    if (!play.playerPositions || play.playerPositions.length === 0) {
      return yPos;
    }
    
    // Section title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Player Instructions', this.margin, yPos);
    yPos += 15;
    
    // Create instructions table
    const instructionData = play.playerPositions.map(pos => [
      pos.playerName,
      pos.position,
      pos.role,
      pos.instructions || 'Standard execution'
    ]);

    this.pdf.autoTable({
      startY: yPos,
      head: [['Player', 'Position', 'Role', 'Instructions']],
      body: instructionData,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: this.getBrandingColor('secondary', [52, 152, 219]),
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 85 },
      },
    });
    
    yPos = (this.pdf as any).lastAutoTable.finalY + 10;
    return yPos;
  }

  private addVideoScreenshotsSection(play: PlaySystem, startY: number): number {
    let yPos = startY;
    
    if (!play.screenshots || play.screenshots.length === 0) {
      return yPos;
    }
    
    // Section title
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Video Analysis', this.margin, yPos);
    yPos += 15;
    
    // Add thumbnails (simplified implementation)
    const thumbWidth = 40;
    const thumbHeight = 25;
    const thumbsPerRow = Math.floor((this.pageWidth - 2 * this.margin) / (thumbWidth + 5));
    
    let currentRow = 0;
    let currentCol = 0;
    
    for (let i = 0; i < Math.min(play.screenshots.length, 6); i++) {
      const x = this.margin + currentCol * (thumbWidth + 5);
      const y = yPos + currentRow * (thumbHeight + 5);
      
      // Draw placeholder rectangle for thumbnail
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(x, y, thumbWidth, thumbHeight);
      
      // Add caption
      this.pdf.setFontSize(6);
      this.pdf.text(`Frame ${i + 1}`, x + thumbWidth/2, y + thumbHeight + 3, { align: 'center' });
      
      currentCol++;
      if (currentCol >= thumbsPerRow) {
        currentCol = 0;
        currentRow++;
      }
    }
    
    yPos += (currentRow + 1) * (thumbHeight + 5) + 10;
    return yPos;
  }

  private addNotesSection(play: PlaySystem, startY: number): number {
    let yPos = startY;
    const contentWidth = this.pageWidth - 2 * this.margin;
    
    // Description
    if (play.description) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Description:', this.margin, yPos);
      yPos += 8;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const splitText = this.pdf.splitTextToSize(play.description, contentWidth);
      this.pdf.text(splitText, this.margin, yPos);
      yPos += splitText.length * 5 + 10;
    }
    
    // Coach notes
    if (play.coachNotes) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Coach Notes:', this.margin, yPos);
      yPos += 8;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const splitNotes = this.pdf.splitTextToSize(play.coachNotes, contentWidth);
      this.pdf.text(splitNotes, this.margin, yPos);
      yPos += splitNotes.length * 5 + 10;
    }
    
    // Key points
    if (play.keyPoints && play.keyPoints.length > 0) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Key Points:', this.margin, yPos);
      yPos += 8;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      play.keyPoints.forEach((point) => {
        this.pdf.text(`• ${point}`, this.margin + 5, yPos);
        yPos += 6;
      });
      yPos += 5;
    }
    
    // Variations
    if (play.variations && play.variations.length > 0) {
      yPos = this.addVariationsSection(play, yPos);
    }
    
    return yPos;
  }

  private addVariationsSection(play: PlaySystem, startY: number): number {
    let yPos = startY;
    const contentWidth = this.pageWidth - 2 * this.margin;
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Variations:', this.margin, yPos);
    yPos += 10;
    
    play.variations?.forEach((variation, index) => {
      // Variation name
      this.pdf.setFontSize(11);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${index + 1}. ${variation.name}`, this.margin + 5, yPos);
      yPos += 7;
      
      // Variation description
      if (variation.description) {
        this.pdf.setFontSize(9);
        this.pdf.setFont('helvetica', 'normal');
        const splitDesc = this.pdf.splitTextToSize(variation.description, contentWidth - 10);
        this.pdf.text(splitDesc, this.margin + 10, yPos);
        yPos += splitDesc.length * 4 + 2;
      }
      
      // Variation effectiveness
      if (variation.effectiveness !== undefined) {
        this.pdf.setFontSize(8);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.text(`Effectiveness: ${variation.effectiveness}%`, this.margin + 10, yPos);
        yPos += 5;
      }
      
      yPos += 3;
    });
    
    return yPos;
  }

  private addStatisticsSection(play: PlaySystem, startY: number): number {
    let yPos = startY;
    
    // Only add if we have statistics
    const hasStats = play.effectiveness !== undefined || 
                     play.successRate !== undefined || 
                     play.usageFrequency !== undefined;
    
    if (!hasStats) return yPos;
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Performance Statistics:', this.margin, yPos);
    yPos += 15;
    
    const statsData: string[][] = [];
    
    if (play.effectiveness !== undefined) {
      statsData.push(['Play Effectiveness', `${play.effectiveness}%`]);
    }
    if (play.successRate !== undefined) {
      statsData.push(['Success Rate', `${play.successRate}%`]);
    }
    if (play.usageFrequency !== undefined) {
      statsData.push(['Times Used This Season', play.usageFrequency.toString()]);
    }

    this.pdf.autoTable({
      startY: yPos,
      body: statsData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 40 },
      },
    });
    
    yPos = (this.pdf as any).lastAutoTable.finalY + 10;
    return yPos;
  }

  private addCustomSection(section: CustomSection) {
    if (section.includePageBreak) {
      this.addPage();
    }
    
    this.addWatermark();
    
    let yPos = 40;
    
    // Section title
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(section.title, this.margin, yPos);
    yPos += 20;
    
    // Section content
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    const contentWidth = this.pageWidth - 2 * this.margin;
    const splitContent = this.pdf.splitTextToSize(section.content, contentWidth);
    this.pdf.text(splitContent, this.margin, yPos);
    
    this.addPageFooter();
  }

  private addAnalyticsSection(plays: PlaySystem[]) {
    this.addPage();
    this.addWatermark();
    
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Analytics Summary', this.margin, 40);
    
    let yPos = 60;
    
    // Calculate analytics
    const analytics = this.calculateAnalytics(plays);
    
    // Overall statistics
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Overall Statistics', this.margin, yPos);
    yPos += 15;
    
    const overallData = [
      ['Total Plays', plays.length.toString()],
      ['Average Effectiveness', `${analytics.avgEffectiveness.toFixed(1)}%`],
      ['Most Used Category', analytics.mostUsedCategory],
      ['Most Common Formation', analytics.mostCommonFormation],
      ['Total Variations', analytics.totalVariations.toString()]
    ];

    this.pdf.autoTable({
      startY: yPos,
      body: overallData,
      theme: 'striped',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 60 },
      },
    });
    
    yPos = (this.pdf as any).lastAutoTable.finalY + 20;
    
    // Category breakdown
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Category Breakdown', this.margin, yPos);
    yPos += 15;
    
    const categoryData = Object.entries(analytics.categoryBreakdown).map(([category, data]) => [
      category.charAt(0).toUpperCase() + category.slice(1),
      data.count.toString(),
      `${((data.count / plays.length) * 100).toFixed(1)}%`,
      `${data.avgEffectiveness.toFixed(1)}%`
    ]);

    this.pdf.autoTable({
      startY: yPos,
      head: [['Category', 'Count', 'Percentage', 'Avg Effectiveness']],
      body: categoryData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: this.getBrandingColor('primary', [41, 128, 185]),
        textColor: 255,
        fontStyle: 'bold',
      },
    });
    
    this.addPageFooter();
  }

  private calculateAnalytics(plays: PlaySystem[]) {
    const categoryBreakdown = plays.reduce((acc, play) => {
      if (!acc[play.category]) {
        acc[play.category] = { count: 0, totalEffectiveness: 0, avgEffectiveness: 0 };
      }
      acc[play.category].count++;
      if (play.effectiveness !== undefined) {
        acc[play.category].totalEffectiveness += play.effectiveness;
      }
      return acc;
    }, {} as Record<string, { count: number; totalEffectiveness: number; avgEffectiveness: number }>);
    
    // Calculate averages
    Object.keys(categoryBreakdown).forEach(category => {
      const data = categoryBreakdown[category];
      data.avgEffectiveness = data.count > 0 ? data.totalEffectiveness / data.count : 0;
    });
    
    const formations = plays.reduce((acc, play) => {
      if (play.formation) {
        acc[play.formation] = (acc[play.formation] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const avgEffectiveness = plays.reduce((sum, play) => {
      return sum + (play.effectiveness || 0);
    }, 0) / plays.length;
    
    const mostUsedCategory = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b.count - a.count)[0]?.[0] || 'None';
    
    const mostCommonFormation = Object.entries(formations)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';
    
    const totalVariations = plays.reduce((sum, play) => {
      return sum + (play.variations?.length || 0);
    }, 0);
    
    return {
      categoryBreakdown,
      avgEffectiveness,
      mostUsedCategory,
      mostCommonFormation,
      totalVariations
    };
  }

  private generatePlayIndex(plays: PlaySystem[]) {
    this.addPage();
    this.addWatermark();
    
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Play Index', this.margin, 40);
    
    let yPos = 60;
    
    // Alphabetical index
    const sortedPlays = [...plays].sort((a, b) => a.name.localeCompare(b.name));
    
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Alphabetical Index', this.margin, yPos);
    yPos += 15;
    
    const indexData = sortedPlays.map((play, index) => [
      play.name,
      play.category,
      play.formation || '-',
      (this.getPlayPageNumber(play.id, plays)).toString()
    ]);

    this.pdf.autoTable({
      startY: yPos,
      head: [['Play Name', 'Category', 'Formation', 'Page']],
      body: indexData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: this.getBrandingColor('primary', [41, 128, 185]),
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
      },
    });
    
    this.addPageFooter();
  }

  private getPlayPageNumber(playId: string, plays: PlaySystem[]): number {
    const playIndex = plays.findIndex(p => p.id === playId);
    let pageNum = 1;
    
    if (this.options.coverPage) pageNum++;
    if (this.options.tableOfContents) pageNum++;
    
    // Add custom sections before plays
    if (this.options.customSections) {
      const beforeSections = this.options.customSections.filter(s => s.position === 'before-plays');
      pageNum += beforeSections.length;
    }
    
    return pageNum + playIndex;
  }

  private addWatermark() {
    if (this.options.watermark) {
      this.pdf.setTextColor(200, 200, 200);
      this.pdf.setFontSize(48);
      this.pdf.setFont('helvetica', 'bold');
      
      this.pdf.saveGraphicsState();
      
      const centerX = this.pageWidth / 2;
      const centerY = this.pageHeight / 2;
      
      this.pdf.text(this.options.watermark, centerX, centerY, {
        align: 'center',
        angle: 45
      });
      
      this.pdf.restoreGraphicsState();
      this.pdf.setTextColor(0, 0, 0);
    }
  }

  private addPageFooter() {
    const footerY = this.pageHeight - 10;
    
    // Page numbers
    if (this.options.pageNumbers) {
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(`Page ${this.currentPage}`, this.pageWidth - this.margin, footerY, { align: 'right' });
    }
    
    // Organization branding
    if (this.options.includeBranding && this.options.customBranding?.organizationName) {
      this.pdf.text(this.options.customBranding.organizationName, this.margin, footerY);
    }
    
    // Footer text or powered by
    const footerText = this.options.footerText || 'Generated by Hockey Hub';
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(128, 128, 128);
    this.pdf.text(footerText, this.pageWidth / 2, footerY, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);
  }

  private addPage() {
    this.pdf.addPage();
    this.currentPage++;
  }

  private generateFileName(plays: PlaySystem[]): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const template = this.options.template;
    const teamName = this.options.customBranding?.teamName || 'Hockey';
    
    if (plays.length === 1) {
      return `${teamName}_${plays[0].name.replace(/\s+/g, '_')}_${timestamp}.pdf`;
    } else {
      return `${teamName}_${template}_${plays.length}plays_${timestamp}.pdf`;
    }
  }

  // Utility method for batch export
  async exportBatch(playGroups: PlaySystem[][], options: ExportOptions[]): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (let i = 0; i < playGroups.length; i++) {
      const exportService = new EnhancedExportService(
        options[i] || this.options,
        this.progressCallback
      );
      
      const result = await exportService.exportPlays(playGroups[i]);
      results.push(result);
    }
    
    return results;
  }
}

export default EnhancedExportService;