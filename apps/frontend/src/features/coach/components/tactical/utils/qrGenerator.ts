/**
 * QR Code generation utility for sharing tactical plays
 * This is a simplified implementation - in production you'd use a proper QR library
 */

export interface QRCodeOptions {
  size: number;
  backgroundColor: string;
  foregroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  includeMargin: boolean;
}

export class QRGenerator {
  private static defaultOptions: QRCodeOptions = {
    size: 200,
    backgroundColor: '#FFFFFF',
    foregroundColor: '#000000',
    errorCorrectionLevel: 'M',
    includeMargin: true
  };

  /**
   * Generate QR code as data URL
   * Note: This is a placeholder implementation
   * In production, use a library like 'qrcode' or 'qr-code-generator'
   */
  static async generateQRCode(
    text: string, 
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    return new Promise((resolve) => {
      // Create a simple placeholder QR code using canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = opts.size;
      canvas.height = opts.size;
      
      // Fill background
      ctx.fillStyle = opts.backgroundColor;
      ctx.fillRect(0, 0, opts.size, opts.size);
      
      // Create a simple pattern that represents a QR code
      ctx.fillStyle = opts.foregroundColor;
      
      const moduleSize = Math.floor(opts.size / 25); // 25x25 grid
      const margin = opts.includeMargin ? moduleSize : 0;
      
      // Draw finder patterns (corners)
      this.drawFinderPattern(ctx, margin, margin, moduleSize);
      this.drawFinderPattern(ctx, opts.size - 7 * moduleSize - margin, margin, moduleSize);
      this.drawFinderPattern(ctx, margin, opts.size - 7 * moduleSize - margin, moduleSize);
      
      // Draw some random data modules to simulate QR code
      const seed = this.hashCode(text);
      const random = this.createSeededRandom(seed);
      
      for (let row = 0; row < 25; row++) {
        for (let col = 0; col < 25; col++) {
          // Skip finder pattern areas
          if (this.isFinderPatternArea(row, col)) continue;
          
          // Draw module based on seeded random
          if (random() > 0.5) {
            const x = margin + col * moduleSize;
            const y = margin + row * moduleSize;
            ctx.fillRect(x, y, moduleSize, moduleSize);
          }
        }
      }
      
      // Add text info at bottom (for debugging)
      if (opts.size > 150) {
        ctx.fillStyle = '#666666';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code', opts.size / 2, opts.size - 5);
      }
      
      resolve(canvas.toDataURL('image/png'));
    });
  }

  /**
   * Generate QR code for sharing URL
   */
  static async generateShareQRCode(shareUrl: string): Promise<string> {
    return this.generateQRCode(shareUrl, {
      size: 150,
      errorCorrectionLevel: 'M'
    });
  }

  /**
   * Generate QR code for mobile app deep link
   */
  static async generateAppQRCode(playId: string, teamId?: string): Promise<string> {
    const deepLink = `hockeyhub://play/${playId}${teamId ? `?team=${teamId}` : ''}`;
    return this.generateQRCode(deepLink, {
      size: 120,
      errorCorrectionLevel: 'H'
    });
  }

  /**
   * Generate QR code for print version
   */
  static async generatePrintQRCode(url: string): Promise<string> {
    return this.generateQRCode(url, {
      size: 100,
      backgroundColor: '#FFFFFF',
      foregroundColor: '#000000',
      errorCorrectionLevel: 'H',
      includeMargin: true
    });
  }

  // Helper methods for QR code generation
  private static drawFinderPattern(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    moduleSize: number
  ) {
    // Outer 7x7 square
    ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
    
    // Inner white 5x5 square
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
    
    // Inner black 3x3 square
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
  }

  private static isFinderPatternArea(row: number, col: number): boolean {
    // Top-left finder pattern
    if (row < 9 && col < 9) return true;
    // Top-right finder pattern
    if (row < 9 && col > 15) return true;
    // Bottom-left finder pattern
    if (row > 15 && col < 9) return true;
    
    return false;
  }

  private static hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static createSeededRandom(seed: number) {
    let currentSeed = seed;
    return function() {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Generate multiple QR codes for batch operations
   */
  static async generateBatchQRCodes(
    urls: string[], 
    options: Partial<QRCodeOptions> = {}
  ): Promise<string[]> {
    const promises = urls.map(url => this.generateQRCode(url, options));
    return Promise.all(promises);
  }

  /**
   * Get QR code with embedded logo (placeholder implementation)
   */
  static async generateQRWithLogo(
    text: string, 
    logoUrl: string,
    options: Partial<QRCodeOptions> = {}
  ): Promise<string> {
    // Generate base QR code
    const baseQR = await this.generateQRCode(text, options);
    const opts = { ...this.defaultOptions, ...options };
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = opts.size;
      canvas.height = opts.size;
      
      const baseImg = new Image();
      baseImg.onload = () => {
        // Draw base QR code
        ctx.drawImage(baseImg, 0, 0);
        
        // Load and draw logo
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoSize = opts.size * 0.2; // Logo is 20% of QR size
          const logoX = (opts.size - logoSize) / 2;
          const logoY = (opts.size - logoSize) / 2;
          
          // Draw white background for logo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
          
          // Draw logo
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          
          resolve(canvas.toDataURL('image/png'));
        };
        
        logoImg.onerror = () => {
          // If logo fails to load, return base QR code
          resolve(baseQR);
        };
        
        logoImg.src = logoUrl;
      };
      
      baseImg.onerror = () => {
        resolve(baseQR);
      };
      
      baseImg.src = baseQR;
    });
  }

  /**
   * Validate QR code URL before generation
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate QR code with analytics tracking
   */
  static async generateTrackingQRCode(
    originalUrl: string, 
    trackingId: string,
    options: Partial<QRCodeOptions> = {}
  ): Promise<{ qrCode: string; trackingUrl: string }> {
    // Create tracking URL
    const trackingUrl = `https://hockeyhub.app/track/${trackingId}?redirect=${encodeURIComponent(originalUrl)}`;
    
    const qrCode = await this.generateQRCode(trackingUrl, options);
    
    return {
      qrCode,
      trackingUrl
    };
  }
}

export default QRGenerator;