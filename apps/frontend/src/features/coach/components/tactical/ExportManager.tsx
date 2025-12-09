'use client';

import React, { useState, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Download,
  FileText,
  Settings,
  Eye,
  Printer,
  Share2,
  Copy,
  QrCode,
  Lock,
  Clock,
  Image,
  FileImage,
  BookOpen,
  Palette,
  Layout,
  Monitor
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from '@hockey-hub/translations';
import PDFGenerator from './utils/pdfGenerator';
import ImageProcessor from './utils/imageProcessor';
import QRGenerator from './utils/qrGenerator';
import AnimationExporter, { 
  AnimationExportConfig, 
  ExportFormat, 
  SocialPreset, 
  ExportEvent, 
  getOptimalExportSettings,
  SOCIAL_PRESETS 
} from './AnimationExporter';
import { AnimationEngine } from './AnimationEngine';

// Extended types for the export system
interface PlaySystem {
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

interface PlayVariation {
  id: string;
  name: string;
  description: string;
  data: any;
}

interface ExportOptions {
  format: 'pdf' | 'png' | 'svg' | 'docx' | 'gif' | 'mp4' | 'webm' | 'png-sequence';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  pageSize: 'A4' | 'Letter' | 'Legal' | 'A3';
  orientation: 'portrait' | 'landscape';
  colorMode: 'color' | 'grayscale' | 'blackwhite';
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
  // Animation-specific options
  animationFrameRate: number;
  socialPreset?: SocialPreset;
  videoCodec?: 'h264' | 'h265' | 'vp8' | 'vp9';
  videoBitrate: number;
  gifLoop: number;
  gifColors: number;
  includeAudioNarration: boolean;
}

interface ShareOptions {
  generateLink: boolean;
  linkExpiration: '1hour' | '1day' | '7days' | '30days' | 'never';
  passwordProtected: boolean;
  password?: string;
  allowDownload: boolean;
  allowComments: boolean;
  includeQRCode: boolean;
}

interface ExportProgress {
  stage: string;
  progress: number;
  message: string;
}

interface ExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  playSystem?: PlaySystem;
  playSystems?: PlaySystem[];
  tacticalBoardRef?: React.RefObject<HTMLDivElement>;
  animationEngine?: AnimationEngine;
  canvasElement?: HTMLCanvasElement;
  onExportComplete?: (exportData: any) => void;
}

export default function ExportManager({
  isOpen,
  onClose,
  playSystem,
  playSystems = [],
  tacticalBoardRef,
  animationEngine,
  canvasElement,
  onExportComplete
}: ExportManagerProps) {
  const { t } = useTranslation(['coach', 'common']);
  const [activeTab, setActiveTab] = useState('options');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  // Export options state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 'high',
    pageSize: 'A4',
    orientation: 'landscape',
    colorMode: 'color',
    includeMetadata: true,
    includeNotes: true,
    includeAnimationFrames: false,
    includeBranding: true,
    includeQRCode: false,
    pageNumbers: true,
    tableOfContents: false,
    compression: true,
    // Animation-specific defaults
    animationFrameRate: 30,
    socialPreset: 'custom',
    videoCodec: 'h264',
    videoBitrate: 2000,
    gifLoop: 0,
    gifColors: 256,
    includeAudioNarration: false
  });

  // Share options state
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    generateLink: true,
    linkExpiration: '7days',
    passwordProtected: false,
    allowDownload: true,
    allowComments: false,
    includeQRCode: true
  });

  // Selected plays for batch export
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<'single' | 'batch' | 'playbook'>('single');
  
  // Animation export state
  const [animationExporter] = useState(() => new AnimationExporter());
  const [animationProgress, setAnimationProgress] = useState<any>(null);
  const [isAnimationExport, setIsAnimationExport] = useState(false);

  // Update export option
  const updateExportOption = useCallback(<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update share option
  const updateShareOption = useCallback(<K extends keyof ShareOptions>(
    key: K,
    value: ShareOptions[K]
  ) => {
    setShareOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Generate QR Code for sharing
  const generateQRCode = useCallback(async (url: string): Promise<string> => {
    try {
      return await QRGenerator.generateShareQRCode(url);
    } catch (error) {
      console.error('QR code generation failed:', error);
      // Return a fallback placeholder
      return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
    }
  }, []);

  // Capture tactical board canvas
  const captureTacticalBoard = useCallback(async (): Promise<string> => {
    if (!tacticalBoardRef?.current) {
      throw new Error('Tactical board reference not available');
    }

    const canvas = await html2canvas(tacticalBoardRef.current, {
      backgroundColor: '#ffffff',
      scale: exportOptions.quality === 'ultra' ? 3 : 
             exportOptions.quality === 'high' ? 2 : 
             exportOptions.quality === 'medium' ? 1.5 : 1,
      useCORS: true,
      allowTaint: false
    });

    return canvas.toDataURL('image/png');
  }, [tacticalBoardRef, exportOptions.quality]);

  // Convert image to grayscale/black and white
  const processImage = useCallback(async (imageData: string): Promise<string> => {
    try {
      return await ImageProcessor.processImage(imageData, exportOptions.colorMode, exportOptions.quality);
    } catch (error) {
      console.error('Image processing failed:', error);
      return imageData; // Return original if processing fails
    }
  }, [exportOptions.colorMode, exportOptions.quality]);

  // Generate PDF document
  const generatePDF = useCallback(async (
    plays: PlaySystem[],
    imageData: string[]
  ): Promise<Uint8Array> => {
    try {
      const pdfGenerator = new PDFGenerator({
        pageSize: exportOptions.pageSize,
        orientation: exportOptions.orientation,
        includeMetadata: exportOptions.includeMetadata,
        includeNotes: exportOptions.includeNotes,
        includeAnimationFrames: exportOptions.includeAnimationFrames,
        includeBranding: exportOptions.includeBranding,
        includeQRCode: exportOptions.includeQRCode,
        customBranding: exportOptions.customBranding,
        watermark: exportOptions.watermark,
        pageNumbers: exportOptions.pageNumbers,
        tableOfContents: exportOptions.tableOfContents,
        compression: exportOptions.compression,
        colorMode: exportOptions.colorMode
      });

      if (exportMode === 'playbook') {
        return await pdfGenerator.generatePlaybook(plays, imageData);
      } else {
        return await pdfGenerator.generateSinglePlay(plays[0], imageData[0]);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    }
  }, [exportOptions, exportMode]);

  // Generate PNG export
  const generatePNG = useCallback(async (imageData: string[]): Promise<Blob[]> => {
    const blobs = await Promise.all(
      imageData.map(async (data) => {
        const processedImage = await processImage(data);
        const response = await fetch(processedImage);
        return response.blob();
      })
    );
    return blobs;
  }, [processImage]);

  // Animation export function
  const handleAnimationExport = useCallback(async () => {
    if (!animationEngine || !canvasElement) {
      toast.error('Animation engine or canvas not available for animation export');
      return;
    }

    setIsExporting(true);
    setIsAnimationExport(true);
    setExportProgress({ stage: 'Initializing', progress: 0, message: 'Preparing animation export...' });

    try {
      // Create animation export configuration
      const animationConfig: Partial<AnimationExportConfig> = {
        format: exportOptions.format as ExportFormat,
        socialPreset: exportOptions.socialPreset,
        resolution: {
          width: exportOptions.socialPreset === 'custom' ? 1280 : 
                 SOCIAL_PRESETS[exportOptions.socialPreset!]?.resolution?.width || 1280,
          height: exportOptions.socialPreset === 'custom' ? 720 :
                  SOCIAL_PRESETS[exportOptions.socialPreset!]?.resolution?.height || 720,
          aspectRatio: '16:9',
          scaleMethod: 'fit'
        },
        gifOptions: {
          frameRate: exportOptions.animationFrameRate,
          quality: exportOptions.quality === 'low' ? 60 : 
                  exportOptions.quality === 'medium' ? 75 :
                  exportOptions.quality === 'high' ? 85 : 95,
          loop: exportOptions.gifLoop,
          dithering: true,
          colors: exportOptions.gifColors,
          transparent: false,
          backgroundColor: '#ffffff'
        },
        videoOptions: {
          format: exportOptions.format as 'mp4' | 'webm',
          codec: exportOptions.videoCodec as any,
          frameRate: exportOptions.animationFrameRate,
          bitrate: exportOptions.videoBitrate,
          quality: 23,
          enableAudio: exportOptions.includeAudioNarration,
          audioCodec: 'aac',
          fadeDuration: 0.5
        },
        overlayOptions: {
          includeTitle: exportOptions.includeMetadata,
          titlePosition: 'top-center',
          titleFont: {
            family: 'Arial, sans-serif',
            size: 24,
            color: '#ffffff',
            weight: 'bold',
            shadow: true
          },
          includeBranding: exportOptions.includeBranding,
          coachName: exportOptions.customBranding?.coachName,
          teamName: exportOptions.customBranding?.teamName,
          watermark: exportOptions.watermark,
          watermarkPosition: 'bottom-right',
          includeTimestamp: true,
          includeMetadata: exportOptions.includeMetadata
        }
      };

      // Set up progress listener
      animationExporter.on(ExportEvent.PROGRESS_UPDATE, (progress) => {
        setAnimationProgress(progress);
        setExportProgress({
          stage: progress.stage,
          progress: progress.progress,
          message: progress.message
        });
      });

      // Export animation
      const result = await animationExporter.exportAnimation(
        animationEngine,
        canvasElement,
        animationConfig
      );

      if (result.success && result.blob) {
        // Download the file
        const link = document.createElement('a');
        link.href = URL.createObjectURL(result.blob);
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Animation exported successfully as ${result.fileName}`);
        
        if (onExportComplete) {
          onExportComplete({
            fileName: result.fileName,
            format: exportOptions.format,
            fileSize: result.fileSizeBytes,
            exportType: 'animation'
          });
        }
      } else {
        throw new Error(result.error || 'Animation export failed');
      }

    } catch (error) {
      console.error('Animation export failed:', error);
      toast.error(`Animation export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setIsAnimationExport(false);
      animationExporter.removeAllListeners();
      setTimeout(() => setExportProgress(null), 3000);
    }
  }, [
    animationEngine,
    canvasElement,
    exportOptions,
    animationExporter,
    onExportComplete
  ]);

  // Main export function
  const handleExport = useCallback(async () => {
    if (!playSystem && selectedPlays.length === 0) {
      toast.error('No plays selected for export');
      return;
    }

    // Route to animation export for animation formats
    if (['gif', 'mp4', 'webm', 'png-sequence'].includes(exportOptions.format)) {
      return handleAnimationExport();
    }

    setIsExporting(true);
    setExportProgress({ stage: 'Initializing', progress: 0, message: 'Preparing export...' });

    try {
      // Determine which plays to export
      const playsToExport = exportMode === 'single' && playSystem 
        ? [playSystem]
        : playSystems.filter(p => selectedPlays.includes(p.id));

      if (playsToExport.length === 0) {
        throw new Error('No plays to export');
      }

      // Step 1: Capture images
      setExportProgress({ stage: 'Capture', progress: 10, message: 'Capturing tactical boards...' });
      
      const imageData: string[] = [];
      for (let i = 0; i < playsToExport.length; i++) {
        // In a real implementation, you'd switch between plays and capture each one
        const captured = await captureTacticalBoard();
        const processed = await processImage(captured);
        imageData.push(processed);
        
        setExportProgress({ 
          stage: 'Capture', 
          progress: 10 + (40 * (i + 1)) / playsToExport.length, 
          message: `Captured ${i + 1}/${playsToExport.length} plays` 
        });
      }

      // Step 2: Generate export file
      setExportProgress({ stage: 'Generate', progress: 60, message: 'Generating export file...' });

      let exportBlob: Blob;
      let fileName: string;

      switch (exportOptions.format) {
        case 'pdf':
          const pdfData = await generatePDF(playsToExport, imageData);
          exportBlob = new Blob([pdfData], { type: 'application/pdf' });
          fileName = exportMode === 'playbook' 
            ? 'Hockey_Playbook.pdf' 
            : `${playsToExport[0].name.replace(/\s+/g, '_')}.pdf`;
          break;

        case 'png':
          const pngBlobs = await generatePNG(imageData);
          if (pngBlobs.length === 1) {
            exportBlob = pngBlobs[0];
            fileName = `${playsToExport[0].name.replace(/\s+/g, '_')}.png`;
          } else {
            // Create a zip file for multiple images (simplified implementation)
            exportBlob = pngBlobs[0]; // Just export the first for demo
            fileName = `${playsToExport[0].name.replace(/\s+/g, '_')}.png`;
          }
          break;

        default:
          throw new Error(`Export format ${exportOptions.format} not supported yet`);
      }

      // Step 3: Generate sharing link if requested
      if (shareOptions.generateLink) {
        setExportProgress({ stage: 'Share', progress: 80, message: 'Generating sharing link...' });
        
        // Simulate API call to generate sharing link
        const mockShareUrl = `https://hockeyhub.app/shared/${Date.now()}`;
        setShareUrl(mockShareUrl);

        if (shareOptions.includeQRCode) {
          const qrUrl = await generateQRCode(mockShareUrl);
          setQrCodeUrl(qrUrl);
        }
      }

      // Step 4: Download file
      setExportProgress({ stage: 'Download', progress: 90, message: 'Starting download...' });
      
      saveAs(exportBlob, fileName);

      setExportProgress({ stage: 'Complete', progress: 100, message: 'Export completed successfully!' });

      // Generate preview for display
      if (exportOptions.format === 'pdf') {
        const previewUrl = URL.createObjectURL(exportBlob);
        setPreviewUrl(previewUrl);
      }

      toast.success(`Successfully exported ${playsToExport.length} play${playsToExport.length > 1 ? 's' : ''}`);
      
      if (onExportComplete) {
        onExportComplete({
          fileName,
          format: exportOptions.format,
          playsCount: playsToExport.length,
          shareUrl: shareOptions.generateLink ? shareUrl : null
        });
      }

    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setExportProgress({ stage: 'Error', progress: 0, message: 'Export failed' });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(null), 3000);
    }
  }, [
    playSystem, 
    selectedPlays, 
    exportMode, 
    playSystems, 
    exportOptions, 
    shareOptions, 
    captureTacticalBoard, 
    processImage, 
    generatePDF, 
    generatePNG, 
    generateQRCode, 
    shareUrl, 
    onExportComplete,
    handleAnimationExport
  ]);

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share URL copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy URL');
      }
    }
  }, [shareUrl]);

  // Reset state when dialog closes
  const handleClose = useCallback(() => {
    setActiveTab('options');
    setExportProgress(null);
    setPreviewUrl(null);
    setShareUrl(null);
    setQrCodeUrl(null);
    setSelectedPlays([]);
    setAnimationProgress(null);
    setIsAnimationExport(false);
    animationExporter.removeAllListeners();
    onClose();
  }, [onClose, animationExporter]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Tactical Plays
          </DialogTitle>
          <DialogDescription>
            Export your tactical plays as PDF, images, animated GIFs, videos, or shareable links
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="options">
              <Settings className="h-4 w-4 mr-2" />
              Export Options
            </TabsTrigger>
            <TabsTrigger value="selection" disabled={!playSystem && playSystems.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              Play Selection
            </TabsTrigger>
            <TabsTrigger value="share">
              <Share2 className="h-4 w-4 mr-2" />
              Sharing
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!previewUrl}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <TabsContent value="options" className="space-y-6">
              {/* Export Format */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Export Format & Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="format">Format</Label>
                      <Select 
                        value={exportOptions.format} 
                        onValueChange={(value: any) => updateExportOption('format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="png">PNG Image</SelectItem>
                          <SelectItem value="gif">Animated GIF</SelectItem>
                          <SelectItem value="mp4">MP4 Video</SelectItem>
                          <SelectItem value="webm">WebM Video</SelectItem>
                          <SelectItem value="png-sequence">PNG Sequence (ZIP)</SelectItem>
                          <SelectItem value="svg" disabled>SVG Vector (Coming Soon)</SelectItem>
                          <SelectItem value="docx" disabled>Word Document (Coming Soon)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quality">Quality</Label>
                      <Select 
                        value={exportOptions.quality} 
                        onValueChange={(value: any) => updateExportOption('quality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Fast)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High (Recommended)</SelectItem>
                          <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pageSize">Page Size</Label>
                      <Select 
                        value={exportOptions.pageSize} 
                        onValueChange={(value: any) => updateExportOption('pageSize', value)}
                        disabled={exportOptions.format !== 'pdf'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                          <SelectItem value="A3">A3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="orientation">Orientation</Label>
                      <Select 
                        value={exportOptions.orientation} 
                        onValueChange={(value: any) => updateExportOption('orientation', value)}
                        disabled={exportOptions.format !== 'pdf'}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landscape">Landscape (Recommended)</SelectItem>
                          <SelectItem value="portrait">Portrait</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="colorMode">Color Mode</Label>
                    <Select 
                      value={exportOptions.colorMode} 
                      onValueChange={(value: any) => updateExportOption('colorMode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="color">Full Color</SelectItem>
                        <SelectItem value="grayscale">Grayscale</SelectItem>
                        <SelectItem value="blackwhite">Black & White (Print Friendly)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Content Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layout className="h-4 w-4" />
                    Content Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeMetadata" className="text-sm font-medium">
                        Include Play Metadata
                      </Label>
                      <Switch
                        id="includeMetadata"
                        checked={exportOptions.includeMetadata}
                        onCheckedChange={(checked) => updateExportOption('includeMetadata', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeNotes" className="text-sm font-medium">
                        Include Coach Notes & Descriptions
                      </Label>
                      <Switch
                        id="includeNotes"
                        checked={exportOptions.includeNotes}
                        onCheckedChange={(checked) => updateExportOption('includeNotes', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeAnimationFrames" className="text-sm font-medium">
                        Include Animation Sequence Frames
                      </Label>
                      <Switch
                        id="includeAnimationFrames"
                        checked={exportOptions.includeAnimationFrames}
                        onCheckedChange={(checked) => updateExportOption('includeAnimationFrames', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeBranding" className="text-sm font-medium">
                        Include Team Branding
                      </Label>
                      <Switch
                        id="includeBranding"
                        checked={exportOptions.includeBranding}
                        onCheckedChange={(checked) => updateExportOption('includeBranding', checked)}
                      />
                    </div>

                    {exportOptions.format === 'pdf' && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pageNumbers" className="text-sm font-medium">
                            Page Numbers
                          </Label>
                          <Switch
                            id="pageNumbers"
                            checked={exportOptions.pageNumbers}
                            onCheckedChange={(checked) => updateExportOption('pageNumbers', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="tableOfContents" className="text-sm font-medium">
                            Table of Contents (Playbook)
                          </Label>
                          <Switch
                            id="tableOfContents"
                            checked={exportOptions.tableOfContents}
                            onCheckedChange={(checked) => updateExportOption('tableOfContents', checked)}
                            disabled={exportMode !== 'playbook'}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="compression" className="text-sm font-medium">
                            PDF Compression
                          </Label>
                          <Switch
                            id="compression"
                            checked={exportOptions.compression}
                            onCheckedChange={(checked) => updateExportOption('compression', checked)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Branding Options */}
              {exportOptions.includeBranding && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Custom Branding
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="coachName">Coach Name</Label>
                        <Input
                          id="coachName"
                          placeholder="Enter coach name"
                          value={exportOptions.customBranding?.coachName || ''}
                          onChange={(e) => updateExportOption('customBranding', {
                            ...exportOptions.customBranding,
                            coachName: e.target.value
                          })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="teamName">Team Name</Label>
                        <Input
                          id="teamName"
                          placeholder="Enter team name"
                          value={exportOptions.customBranding?.teamName || ''}
                          onChange={(e) => updateExportOption('customBranding', {
                            ...exportOptions.customBranding,
                            teamName: e.target.value
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="organizationName">Organization</Label>
                      <Input
                        id="organizationName"
                        placeholder="Enter organization name"
                        value={exportOptions.customBranding?.organizationName || ''}
                        onChange={(e) => updateExportOption('customBranding', {
                          ...exportOptions.customBranding,
                          organizationName: e.target.value
                        })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="watermark">Watermark Text (Optional)</Label>
                      <Input
                        id="watermark"
                        placeholder="e.g., CONFIDENTIAL, DRAFT"
                        value={exportOptions.watermark || ''}
                        onChange={(e) => updateExportOption('watermark', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Animation-specific options */}
              {['gif', 'mp4', 'webm', 'png-sequence'].includes(exportOptions.format) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Animation Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frameRate">Frame Rate (FPS)</Label>
                        <Select 
                          value={exportOptions.animationFrameRate.toString()} 
                          onValueChange={(value) => updateExportOption('animationFrameRate', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 FPS (Small file)</SelectItem>
                            <SelectItem value="24">24 FPS (Film standard)</SelectItem>
                            <SelectItem value="30">30 FPS (Recommended)</SelectItem>
                            <SelectItem value="60">60 FPS (Smooth)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="socialPreset">Social Media Preset</Label>
                        <Select 
                          value={exportOptions.socialPreset} 
                          onValueChange={(value: SocialPreset) => updateExportOption('socialPreset', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="instagram-story">Instagram Story (9:16)</SelectItem>
                            <SelectItem value="instagram-post">Instagram Post (1:1)</SelectItem>
                            <SelectItem value="instagram-reel">Instagram Reel (9:16)</SelectItem>
                            <SelectItem value="tiktok">TikTok (9:16)</SelectItem>
                            <SelectItem value="twitter">Twitter (16:9)</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp (16:9)</SelectItem>
                            <SelectItem value="telegram">Telegram (16:9)</SelectItem>
                            <SelectItem value="presentation">Presentation (16:9)</SelectItem>
                            <SelectItem value="email">Email (16:9)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* GIF-specific options */}
                    {exportOptions.format === 'gif' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="gifLoop">Loop Count</Label>
                          <Select 
                            value={exportOptions.gifLoop.toString()} 
                            onValueChange={(value) => updateExportOption('gifLoop', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Infinite Loop</SelectItem>
                              <SelectItem value="1">Play Once</SelectItem>
                              <SelectItem value="3">3 Times</SelectItem>
                              <SelectItem value="5">5 Times</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="gifColors">Color Palette</Label>
                          <Select 
                            value={exportOptions.gifColors.toString()} 
                            onValueChange={(value) => updateExportOption('gifColors', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="64">64 Colors (Smallest)</SelectItem>
                              <SelectItem value="128">128 Colors (Balanced)</SelectItem>
                              <SelectItem value="256">256 Colors (Best quality)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Video-specific options */}
                    {['mp4', 'webm'].includes(exportOptions.format) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="videoCodec">Video Codec</Label>
                          <Select 
                            value={exportOptions.videoCodec} 
                            onValueChange={(value: any) => updateExportOption('videoCodec', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="h264">H.264 (Compatible)</SelectItem>
                              <SelectItem value="h265">H.265/HEVC (Smaller files)</SelectItem>
                              <SelectItem value="vp8">VP8 (WebM)</SelectItem>
                              <SelectItem value="vp9">VP9 (WebM, better quality)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="videoBitrate">Video Bitrate (kbps)</Label>
                          <Select 
                            value={exportOptions.videoBitrate.toString()} 
                            onValueChange={(value) => updateExportOption('videoBitrate', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="500">500 kbps (Small file)</SelectItem>
                              <SelectItem value="1000">1 Mbps (WhatsApp friendly)</SelectItem>
                              <SelectItem value="2000">2 Mbps (Balanced)</SelectItem>
                              <SelectItem value="5000">5 Mbps (High quality)</SelectItem>
                              <SelectItem value="8000">8 Mbps (Professional)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Audio options for video */}
                    {['mp4', 'webm'].includes(exportOptions.format) && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeAudioNarration" className="text-sm font-medium">
                          Include Audio Narration (Future)
                        </Label>
                        <Switch
                          id="includeAudioNarration"
                          checked={exportOptions.includeAudioNarration}
                          onCheckedChange={(checked) => updateExportOption('includeAudioNarration', checked)}
                          disabled={true}
                        />
                      </div>
                    )}

                    {/* Animation export requirements */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 mt-0.5">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-blue-800 mb-1">Animation Export Requirements:</p>
                          <ul className="text-blue-700 space-y-1 text-xs">
                            <li>• Animation engine must be loaded with a tactical play</li>
                            <li>• Canvas element must be available for frame capture</li>
                            <li>• Export time depends on play duration and frame rate</li>
                            <li>• Higher quality settings result in larger file sizes</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="selection" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Export Mode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={exportMode} onValueChange={(value: any) => setExportMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {playSystem && (
                        <SelectItem value="single">Single Play - {playSystem.name}</SelectItem>
                      )}
                      <SelectItem value="batch">Selected Plays</SelectItem>
                      <SelectItem value="playbook">Complete Playbook</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {exportMode !== 'single' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Available Plays</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPlays(playSystems.map(p => p.id))}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPlays([])}
                      >
                        Clear All
                      </Button>
                      <Badge variant="secondary">
                        {selectedPlays.length} selected
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {playSystems.map((play) => (
                          <div key={play.id} className="flex items-center space-x-2 p-2 border rounded">
                            <Checkbox
                              id={play.id}
                              checked={selectedPlays.includes(play.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPlays([...selectedPlays, play.id]);
                                } else {
                                  setSelectedPlays(selectedPlays.filter(id => id !== play.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <Label htmlFor={play.id} className="text-sm font-medium">
                                {play.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {play.category} • {play.formation || 'No formation'}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {play.tags.length} tags
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="share" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Sharing Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="generateLink" className="text-sm font-medium">
                      Generate Shareable Link
                    </Label>
                    <Switch
                      id="generateLink"
                      checked={shareOptions.generateLink}
                      onCheckedChange={(checked) => updateShareOption('generateLink', checked)}
                    />
                  </div>

                  {shareOptions.generateLink && (
                    <>
                      <div>
                        <Label htmlFor="linkExpiration">Link Expiration</Label>
                        <Select 
                          value={shareOptions.linkExpiration} 
                          onValueChange={(value: any) => updateShareOption('linkExpiration', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1hour">1 Hour</SelectItem>
                            <SelectItem value="1day">1 Day</SelectItem>
                            <SelectItem value="7days">7 Days</SelectItem>
                            <SelectItem value="30days">30 Days</SelectItem>
                            <SelectItem value="never">Never Expires</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="passwordProtected" className="text-sm font-medium">
                          Password Protected
                        </Label>
                        <Switch
                          id="passwordProtected"
                          checked={shareOptions.passwordProtected}
                          onCheckedChange={(checked) => updateShareOption('passwordProtected', checked)}
                        />
                      </div>

                      {shareOptions.passwordProtected && (
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter password"
                            value={shareOptions.password || ''}
                            onChange={(e) => updateShareOption('password', e.target.value)}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <Label htmlFor="allowDownload" className="text-sm font-medium">
                          Allow Download
                        </Label>
                        <Switch
                          id="allowDownload"
                          checked={shareOptions.allowDownload}
                          onCheckedChange={(checked) => updateShareOption('allowDownload', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="includeQRCode" className="text-sm font-medium">
                          Generate QR Code
                        </Label>
                        <Switch
                          id="includeQRCode"
                          checked={shareOptions.includeQRCode}
                          onCheckedChange={(checked) => updateShareOption('includeQRCode', checked)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {shareUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Generated Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Share URL</Label>
                      <div className="flex gap-2">
                        <Input value={shareUrl} readOnly />
                        <Button size="sm" variant="outline" onClick={copyShareUrl}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {qrCodeUrl && (
                      <div>
                        <Label>QR Code</Label>
                        <div className="flex items-center gap-4">
                          <img src={qrCodeUrl} alt="QR Code" className="h-24 w-24 border" />
                          <div className="text-sm text-muted-foreground">
                            Scan with mobile device to access the shared play
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {previewUrl ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Export Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <embed
                        src={previewUrl}
                        type="application/pdf"
                        width="100%"
                        height="500px"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Preview Available</h3>
                    <p className="text-muted-foreground">
                      Complete an export to see the preview here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Export Progress */}
        {exportProgress && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{exportProgress.stage}</span>
                  <span>{Math.round(exportProgress.progress)}%</span>
                </div>
                <Progress value={exportProgress.progress} />
                <p className="text-sm text-muted-foreground">{exportProgress.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {exportMode === 'single' && playSystem && (
                <Badge variant="outline">1 play</Badge>
              )}
              {exportMode !== 'single' && (
                <Badge variant="outline">
                  {selectedPlays.length} play{selectedPlays.length !== 1 ? 's' : ''} selected
                </Badge>
              )}
              <Badge variant="outline">{exportOptions.format.toUpperCase()}</Badge>
              <Badge variant="outline">{exportOptions.quality}</Badge>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isExporting}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || (exportMode !== 'single' && selectedPlays.length === 0)}
                className="min-w-[120px]"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isAnimationExport ? 'Creating Animation...' : 'Exporting...'}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {['gif', 'mp4', 'webm', 'png-sequence'].includes(exportOptions.format) ? 'Export Animation' : 'Export'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}