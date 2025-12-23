// @ts-nocheck - ClamAV types not available
import ClamAV from 'clamav.js';

export interface ScanResult {
  isInfected: boolean;
  virusName?: string;
  error?: string;
  scannedAt: Date;
}

export class VirusScanService {
  private scanner: any;
  private enabled: boolean;
  private host: string;
  private port: number;

  constructor(config: {
    enabled: boolean;
    host?: string;
    port?: number;
  }) {
    this.enabled = config.enabled;
    this.host = config.host || 'localhost';
    this.port = config.port || 3310;

    if (this.enabled) {
      this.initializeScanner();
    }
  }

  private async initializeScanner(): Promise<void> {
    try {
      this.scanner = ClamAV.createScanner({
        host: this.host,
        port: this.port,
      });
      console.log('Virus scanner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize virus scanner:', error);
      this.enabled = false;
    }
  }

  async scanBuffer(buffer: Buffer): Promise<ScanResult> {
    if (!this.enabled) {
      return {
        isInfected: false,
        scannedAt: new Date(),
      };
    }

    try {
      const result = await this.scanner.scanBuffer(buffer);
      
      return {
        isInfected: result.isInfected,
        virusName: result.viruses?.join(', '),
        scannedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Virus scan failed:', error);
      
      // In case of scan failure, we should treat it as potentially infected
      // or implement a retry mechanism
      return {
        isInfected: false, // Or true for stricter security
        error: error.message,
        scannedAt: new Date(),
      };
    }
  }

  async scanFile(filePath: string): Promise<ScanResult> {
    if (!this.enabled) {
      return {
        isInfected: false,
        scannedAt: new Date(),
      };
    }

    try {
      const result = await this.scanner.scanFile(filePath);
      
      return {
        isInfected: result.isInfected,
        virusName: result.viruses?.join(', '),
        scannedAt: new Date(),
      };
    } catch (error: any) {
      console.error('Virus scan failed:', error);
      
      return {
        isInfected: false,
        error: error.message,
        scannedAt: new Date(),
      };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}