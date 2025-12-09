import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

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
}

export interface PlayVariation {
  id: string;
  name: string;
  description: string;
  data: any;
}

export interface PDFExportOptions {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
  orientation: 'portrait' | 'landscape';
  includeMetadata: boolean;
  includeNotes: boolean;
  includeAnimationFrames: boolean;
  includeBranding: boolean;
  includeQRCode: boolean;
  customBranding?: {
    teamLogo?: string;
    coachName?: string;
    teamName?: string;
    organizationName?: string;
  };
  watermark?: string;
  pageNumbers: boolean;
  tableOfContents: boolean;
  compression: boolean;
  colorMode: 'color' | 'grayscale' | 'blackwhite';
}

export class PDFGenerator {
  private pdf: jsPDF;
  private options: PDFExportOptions;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentPage: number = 1;

  constructor(options: PDFExportOptions) {
    this.options = options;
    this.pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'mm',
      format: options.pageSize.toLowerCase() as any,
      compress: options.compression
    });
    
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  async generatePlaybook(plays: PlaySystem[], images: string[]): Promise<Uint8Array> {
    // Add title page
    if (plays.length > 1) {
      this.addTitlePage(plays.length);
      
      if (this.options.tableOfContents) {
        this.addTableOfContents(plays);
      }
    }

    // Add each play
    for (let i = 0; i < plays.length; i++) {
      if (i > 0 || plays.length > 1) {
        this.addPage();
      }
      await this.addPlayPage(plays[i], images[i]);
    }

    return this.pdf.output('arraybuffer') as Uint8Array;
  }

  private addTitlePage(playCount: number) {
    this.addWatermark();
    
    // Title
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Hockey Playbook', this.pageWidth / 2, 50, { align: 'center' });
    
    // Team info
    if (this.options.customBranding?.teamName) {
      this.pdf.setFontSize(18);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(this.options.customBranding.teamName, this.pageWidth / 2, 70, { align: 'center' });
    }

    if (this.options.customBranding?.coachName) {
      this.pdf.setFontSize(14);
      this.pdf.text(`Coach: ${this.options.customBranding.coachName}`, this.pageWidth / 2, 90, { align: 'center' });
    }

    // Stats box
    const statsY = 120;
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Playbook Statistics:', this.margin, statsY);
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Total Plays: ${playCount}`, this.margin, statsY + 15);
    this.pdf.text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, statsY + 25);
    this.pdf.text(`Version: 1.0`, this.margin, statsY + 35);

    // Footer
    this.addPageFooter();
  }

  private addTableOfContents(plays: PlaySystem[]) {
    this.addPage();
    this.addWatermark();
    
    this.pdf.setFontSize(18);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Table of Contents', this.margin, 40);
    
    // Create table data
    const tableData = plays.map((play, index) => [
      (index + 1).toString(),
      play.name,
      play.category.charAt(0).toUpperCase() + play.category.slice(1),
      play.formation || '-',
      `${this.currentPage + index + 1}`
    ]);

    this.pdf.autoTable({
      startY: 60,
      head: [['#', 'Play Name', 'Category', 'Formation', 'Page']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 },
      },
    });

    this.addPageFooter();
  }

  private async addPlayPage(play: PlaySystem, image: string) {
    this.addWatermark();
    
    let yPos = 30;
    
    // Play title
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(play.name, this.margin, yPos);
    yPos += 20;

    // Metadata section
    if (this.options.includeMetadata) {
      yPos = this.addMetadataSection(play, yPos);
      yPos += 10;
    }

    // Diagram
    if (image) {
      const contentWidth = this.pageWidth - 2 * this.margin;
      const imgWidth = Math.min(contentWidth * 0.8, 120);
      const imgHeight = (imgWidth * 400) / 800; // Maintain aspect ratio
      
      // Center the image
      const imgX = (this.pageWidth - imgWidth) / 2;
      
      this.pdf.addImage(image, 'PNG', imgX, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 15;
    }

    // Notes and description
    if (this.options.includeNotes) {
      yPos = this.addNotesSection(play, yPos);
    }

    // QR Code if enabled
    if (this.options.includeQRCode) {
      this.addQRCode();
    }

    this.addPageFooter();
  }

  private addMetadataSection(play: PlaySystem, startY: number): number {
    let yPos = startY;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    // Category badge
    this.pdf.setFillColor(200, 200, 200);
    this.pdf.rect(this.margin, yPos - 6, 35, 10, 'F');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(play.category.toUpperCase(), this.margin + 2, yPos);
    
    // Formation and situation
    let infoX = this.margin + 45;
    if (play.formation) {
      this.pdf.text(`Formation: ${play.formation}`, infoX, yPos);
      infoX += 50;
    }
    if (play.situation) {
      this.pdf.text(`Situation: ${play.situation}`, infoX, yPos);
    }
    
    yPos += 15;
    
    // Tags
    if (play.tags.length > 0) {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Tags:', this.margin, yPos);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(play.tags.join(', '), this.margin + 25, yPos);
      yPos += 10;
    }
    
    // Last updated
    this.pdf.setFont('helvetica', 'italic');
    this.pdf.setFontSize(8);
    this.pdf.text(`Last updated: ${play.updatedAt.toLocaleDateString()}`, this.margin, yPos);
    yPos += 8;
    
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
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Variations:', this.margin, yPos);
      yPos += 8;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      play.variations.forEach((variation, index) => {
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(`${index + 1}. ${variation.name}`, this.margin + 5, yPos);
        yPos += 6;
        
        if (variation.description) {
          this.pdf.setFont('helvetica', 'normal');
          const splitDesc = this.pdf.splitTextToSize(variation.description, contentWidth - 10);
          this.pdf.text(splitDesc, this.margin + 10, yPos);
          yPos += splitDesc.length * 4 + 3;
        }
      });
      yPos += 5;
    }
    
    return yPos;
  }

  private addWatermark() {
    if (this.options.watermark) {
      this.pdf.setTextColor(200, 200, 200);
      this.pdf.setFontSize(48);
      this.pdf.setFont('helvetica', 'bold');
      
      // Save current transformation matrix
      this.pdf.saveGraphicsState();
      
      // Rotate and add watermark text
      const centerX = this.pageWidth / 2;
      const centerY = this.pageHeight / 2;
      
      this.pdf.text(this.options.watermark, centerX, centerY, {
        align: 'center',
        angle: 45
      });
      
      // Restore transformation matrix
      this.pdf.restoreGraphicsState();
      
      // Reset text color
      this.pdf.setTextColor(0, 0, 0);
    }
  }

  private addQRCode() {
    const qrSize = 25;
    const qrX = this.pageWidth - this.margin - qrSize;
    const qrY = this.pageHeight - this.margin - qrSize - 15;
    
    this.pdf.setFontSize(8);
    this.pdf.text('Scan to view online:', qrX - 20, qrY - 5);
    
    // Placeholder for QR code - in real implementation, generate actual QR code
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.rect(qrX, qrY, qrSize, qrSize);
    this.pdf.setFontSize(6);
    this.pdf.text('QR', qrX + qrSize/2 - 3, qrY + qrSize/2 + 1);
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

    // Powered by Hockey Hub
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(128, 128, 128);
    this.pdf.text('Generated by Hockey Hub', this.pageWidth / 2, footerY, { align: 'center' });
    this.pdf.setTextColor(0, 0, 0);
  }

  private addPage() {
    this.pdf.addPage();
    this.currentPage++;
  }

  async generateSinglePlay(play: PlaySystem, image: string): Promise<Uint8Array> {
    await this.addPlayPage(play, image);
    return this.pdf.output('arraybuffer') as Uint8Array;
  }

  // Generate play comparison document
  async generatePlayComparison(plays: PlaySystem[], images: string[]): Promise<Uint8Array> {
    this.addWatermark();
    
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Play Comparison', this.pageWidth / 2, 30, { align: 'center' });
    
    let yPos = 50;
    
    // Comparison table
    const tableData = plays.map((play, index) => [
      play.name,
      play.category,
      play.formation || '-',
      play.situation || '-',
      play.tags.join(', ') || '-'
    ]);

    this.pdf.autoTable({
      startY: yPos,
      head: [['Play Name', 'Category', 'Formation', 'Situation', 'Tags']],
      body: tableData,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold',
      },
    });

    // Add individual play pages
    for (let i = 0; i < plays.length; i++) {
      this.addPage();
      await this.addPlayPage(plays[i], images[i]);
    }

    return this.pdf.output('arraybuffer') as Uint8Array;
  }

  // Generate statistics report
  generatePlayStatistics(plays: PlaySystem[]): Uint8Array {
    this.addWatermark();
    
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Playbook Statistics', this.pageWidth / 2, 30, { align: 'center' });
    
    let yPos = 60;
    
    // Calculate statistics
    const stats = this.calculatePlayStatistics(plays);
    
    // Overall stats
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Overall Statistics', this.margin, yPos);
    yPos += 15;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    Object.entries(stats.overall).forEach(([key, value]) => {
      this.pdf.text(`${key}: ${value}`, this.margin, yPos);
      yPos += 8;
    });
    
    yPos += 10;
    
    // Category breakdown
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Category Breakdown', this.margin, yPos);
    yPos += 15;
    
    const categoryData = Object.entries(stats.categories).map(([category, count]) => [
      category.charAt(0).toUpperCase() + category.slice(1),
      count.toString(),
      `${((count as number / plays.length) * 100).toFixed(1)}%`
    ]);

    this.pdf.autoTable({
      startY: yPos,
      head: [['Category', 'Count', 'Percentage']],
      body: categoryData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
      },
    });

    this.addPageFooter();
    
    return this.pdf.output('arraybuffer') as Uint8Array;
  }

  private calculatePlayStatistics(plays: PlaySystem[]) {
    const categories = plays.reduce((acc, play) => {
      acc[play.category] = (acc[play.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const formations = plays.reduce((acc, play) => {
      if (play.formation) {
        acc[play.formation] = (acc[play.formation] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalTags = plays.reduce((acc, play) => acc + play.tags.length, 0);
    const avgTagsPerPlay = totalTags / plays.length;

    return {
      overall: {
        'Total Plays': plays.length,
        'Average Tags per Play': avgTagsPerPlay.toFixed(1),
        'Most Common Formation': Object.entries(formations).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None',
        'Creation Date Range': `${Math.min(...plays.map(p => p.createdAt.getTime()))} - ${Math.max(...plays.map(p => p.createdAt.getTime()))}`
      },
      categories,
      formations
    };
  }
}

export default PDFGenerator;