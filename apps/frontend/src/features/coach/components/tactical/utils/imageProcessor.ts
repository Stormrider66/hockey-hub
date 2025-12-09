/**
 * Image processing utilities for tactical play export
 */

export type ColorMode = 'color' | 'grayscale' | 'blackwhite';
export type ImageQuality = 'low' | 'medium' | 'high' | 'ultra';

export class ImageProcessor {
  /**
   * Convert image to different color modes
   */
  static async processImage(
    imageData: string, 
    colorMode: ColorMode = 'color',
    quality: ImageQuality = 'high'
  ): Promise<string> {
    return new Promise((resolve) => {
      if (colorMode === 'color') {
        resolve(imageData);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Set canvas size based on quality
        const scaleFactor = this.getScaleFactor(quality);
        canvas.width = img.width * scaleFactor;
        canvas.height = img.height * scaleFactor;

        // Draw and scale image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if (colorMode !== 'color') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Apply color transformation
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            
            if (colorMode === 'blackwhite') {
              // Convert to pure black or white using dithering
              const threshold = 128;
              const bw = gray > threshold ? 255 : 0;
              data[i] = bw;     // Red
              data[i + 1] = bw; // Green
              data[i + 2] = bw; // Blue
            } else {
              // Convert to grayscale
              data[i] = gray;     // Red
              data[i + 1] = gray; // Green
              data[i + 2] = gray; // Blue
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => {
        // If image processing fails, return original
        resolve(imageData);
      };
      
      img.src = imageData;
    });
  }

  /**
   * Get scale factor based on quality setting
   */
  private static getScaleFactor(quality: ImageQuality): number {
    switch (quality) {
      case 'low': return 0.5;
      case 'medium': return 1;
      case 'high': return 1.5;
      case 'ultra': return 2;
      default: return 1;
    }
  }

  /**
   * Add print-friendly enhancements to tactical board images
   */
  static async enhanceForPrint(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Enhance contrast and clarity for print
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          // Increase contrast
          const contrast = 1.2;
          data[i] = Math.max(0, Math.min(255, contrast * (data[i] - 128) + 128));
          data[i + 1] = Math.max(0, Math.min(255, contrast * (data[i + 1] - 128) + 128));
          data[i + 2] = Math.max(0, Math.min(255, contrast * (data[i + 2] - 128) + 128));
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => resolve(imageData);
      img.src = imageData;
    });
  }

  /**
   * Create thumbnail version of image
   */
  static async createThumbnail(
    imageData: string, 
    maxWidth: number = 200, 
    maxHeight: number = 150
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Calculate new dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let { width, height } = img;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => resolve(imageData);
      img.src = imageData;
    });
  }

  /**
   * Add watermark to image
   */
  static async addWatermark(
    imageData: string, 
    watermarkText: string, 
    opacity: number = 0.3
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Add watermark
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#888888';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        
        // Rotate for diagonal watermark
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => resolve(imageData);
      img.src = imageData;
    });
  }

  /**
   * Create animation frame sequence for animated plays
   */
  static async createAnimationFrames(
    baseImageData: string,
    animationData: any[], // Animation keyframes
    frameCount: number = 8
  ): Promise<string[]> {
    const frames: string[] = [];
    
    // For now, just return the base image multiple times
    // In a real implementation, you would generate actual animation frames
    for (let i = 0; i < frameCount; i++) {
      frames.push(baseImageData);
    }
    
    return frames;
  }

  /**
   * Combine multiple images into a grid layout
   */
  static async createImageGrid(
    images: string[], 
    columns: number = 2,
    spacing: number = 10
  ): Promise<string> {
    if (images.length === 0) return '';
    
    return new Promise((resolve) => {
      const loadedImages: HTMLImageElement[] = [];
      let loadedCount = 0;

      // Load all images first
      images.forEach((imgData, index) => {
        const img = new Image();
        img.onload = () => {
          loadedImages[index] = img;
          loadedCount++;
          
          if (loadedCount === images.length) {
            // All images loaded, create grid
            const rows = Math.ceil(images.length / columns);
            const cellWidth = loadedImages[0].width;
            const cellHeight = loadedImages[0].height;
            
            const gridWidth = columns * cellWidth + (columns - 1) * spacing;
            const gridHeight = rows * cellHeight + (rows - 1) * spacing;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = gridWidth;
            canvas.height = gridHeight;
            
            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, gridWidth, gridHeight);
            
            // Draw images in grid
            loadedImages.forEach((img, index) => {
              const row = Math.floor(index / columns);
              const col = index % columns;
              const x = col * (cellWidth + spacing);
              const y = row * (cellHeight + spacing);
              
              ctx.drawImage(img, x, y);
            });
            
            resolve(canvas.toDataURL('image/png'));
          }
        };
        
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === images.length) {
            resolve(images[0] || ''); // Return first image if grid creation fails
          }
        };
        
        img.src = imgData;
      });
    });
  }
}

export default ImageProcessor;