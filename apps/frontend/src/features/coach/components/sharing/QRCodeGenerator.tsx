'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  QrCode,
  Download,
  Copy,
  Share2,
  Palette,
  Image,
  Settings,
  RefreshCw,
  Smartphone,
  Monitor,
  Printer,
  Mail,
  Zap,
  Eye,
  FileImage,
  FileCode
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslation } from '@hockey-hub/translations';

// QR Code configuration types
export type QRCodeStyle = 'square' | 'rounded' | 'dots' | 'classy';
export type QRCodeFormat = 'png' | 'svg' | 'pdf' | 'jpeg';
export type QRCodeSize = 'small' | 'medium' | 'large' | 'xlarge' | 'custom';
export type QRErrorCorrection = 'low' | 'medium' | 'quartile' | 'high';

export interface QRCodeOptions {
  // Content
  data: string;
  format: QRCodeFormat;
  
  // Size and quality
  size: QRCodeSize;
  customSize?: number;
  margin: number;
  errorCorrection: QRErrorCorrection;
  
  // Style
  style: QRCodeStyle;
  foregroundColor: string;
  backgroundColor: string;
  gradient?: {
    enabled: boolean;
    startColor: string;
    endColor: string;
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
  
  // Logo/branding
  logo?: {
    enabled: boolean;
    url: string;
    size: number;
    margin: number;
    cornerRadius: number;
    background: boolean;
    backgroundColor: string;
  };
  
  // Frame
  frame?: {
    enabled: boolean;
    style: 'none' | 'square' | 'rounded' | 'banner';
    color: string;
    thickness: number;
    text?: string;
    textColor: string;
    textSize: number;
  };
  
  // Advanced
  quietZone: number;
  rounded: boolean;
  roundedSize: number;
  dotScale: number;
  
  // Metadata
  title?: string;
  description?: string;
  tags?: string[];
}

export interface QRCodePreset {
  name: string;
  description: string;
  icon: React.ReactNode;
  options: Partial<QRCodeOptions>;
}

export interface QRCodeGeneratorProps {
  initialUrl?: string;
  initialOptions?: Partial<QRCodeOptions>;
  onGenerated?: (qrCode: string, options: QRCodeOptions) => void;
  showPresets?: boolean;
  showBatch?: boolean;
  className?: string;
}

// Predefined presets
const QR_PRESETS: QRCodePreset[] = [
  {
    name: 'Professional',
    description: 'Clean, business-ready QR code',
    icon: <Monitor className="h-4 w-4" />,
    options: {
      style: 'square',
      foregroundColor: '#1f2937',
      backgroundColor: '#ffffff',
      errorCorrection: 'medium',
      margin: 4,
      frame: {
        enabled: false
      }
    }
  },
  {
    name: 'Mobile Friendly',
    description: 'Optimized for mobile scanning',
    icon: <Smartphone className="h-4 w-4" />,
    options: {
      style: 'rounded',
      foregroundColor: '#059669',
      backgroundColor: '#ecfdf5',
      errorCorrection: 'high',
      margin: 6,
      rounded: true,
      roundedSize: 0.3
    }
  },
  {
    name: 'Print Ready',
    description: 'High contrast for printing',
    icon: <Printer className="h-4 w-4" />,
    options: {
      style: 'square',
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      errorCorrection: 'quartile',
      margin: 8,
      size: 'large'
    }
  },
  {
    name: 'Branded',
    description: 'With logo and custom colors',
    icon: <Palette className="h-4 w-4" />,
    options: {
      style: 'classy',
      foregroundColor: '#3b82f6',
      backgroundColor: '#ffffff',
      gradient: {
        enabled: true,
        startColor: '#3b82f6',
        endColor: '#1d4ed8',
        direction: 'diagonal'
      },
      logo: {
        enabled: true,
        url: '',
        size: 0.15,
        margin: 2,
        cornerRadius: 8,
        background: true,
        backgroundColor: '#ffffff'
      }
    }
  },
  {
    name: 'Social Media',
    description: 'Eye-catching for social sharing',
    icon: <Share2 className="h-4 w-4" />,
    options: {
      style: 'dots',
      foregroundColor: '#ec4899',
      backgroundColor: '#fdf2f8',
      gradient: {
        enabled: true,
        startColor: '#ec4899',
        endColor: '#be185d',
        direction: 'vertical'
      },
      frame: {
        enabled: true,
        style: 'banner',
        color: '#ec4899',
        thickness: 3,
        text: 'Scan Me!',
        textColor: '#ffffff',
        textSize: 14
      }
    }
  },
  {
    name: 'Minimalist',
    description: 'Clean and simple design',
    icon: <Zap className="h-4 w-4" />,
    options: {
      style: 'dots',
      foregroundColor: '#64748b',
      backgroundColor: '#f8fafc',
      margin: 2,
      dotScale: 0.8,
      quietZone: 1
    }
  }
];

// Size configurations
const SIZE_CONFIGS = {
  small: { size: 128, label: '128×128px' },
  medium: { size: 256, label: '256×256px' },
  large: { size: 512, label: '512×512px' },
  xlarge: { size: 1024, label: '1024×1024px' },
  custom: { size: 256, label: 'Custom' }
};

export default function QRCodeGenerator({
  initialUrl = '',
  initialOptions = {},
  onGenerated,
  showPresets = true,
  showBatch = false,
  className
}: QRCodeGeneratorProps) {
  const { t } = useTranslation(['coach', 'common']);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  // QR Code options with defaults
  const [options, setOptions] = useState<QRCodeOptions>({
    data: initialUrl,
    format: 'png',
    size: 'medium',
    margin: 4,
    errorCorrection: 'medium',
    style: 'square',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    quietZone: 1,
    rounded: false,
    roundedSize: 0.3,
    dotScale: 1.0,
    ...initialOptions
  });

  // Batch generation state
  const [batchUrls, setBatchUrls] = useState<string>('');
  const [batchResults, setBatchResults] = useState<Array<{ url: string; qr: string; success: boolean }>>([]);

  // Update option
  const updateOption = useCallback(<K extends keyof QRCodeOptions>(
    key: K,
    value: QRCodeOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update nested option (for objects like gradient, logo, frame)
  const updateNestedOption = useCallback(<T extends keyof QRCodeOptions>(
    parent: T,
    key: keyof QRCodeOptions[T],
    value: any
  ) => {
    setOptions(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  }, []);

  // Apply preset
  const applyPreset = useCallback((preset: QRCodePreset) => {
    setOptions(prev => ({
      ...prev,
      ...preset.options
    }));
    toast.success(`Applied ${preset.name} preset`);
  }, []);

  // Generate QR code
  const generateQRCode = useCallback(async () => {
    if (!options.data.trim()) {
      toast.error('Please enter URL or text to generate QR code');
      return;
    }

    setIsGenerating(true);

    try {
      // In a real implementation, you would use a QR code library like 'qrcode'
      // For demo purposes, we'll create a simple mock implementation
      const qrDataUrl = await createMockQRCode(options);
      setGeneratedQR(qrDataUrl);
      
      if (onGenerated) {
        onGenerated(qrDataUrl, options);
      }

      toast.success('QR code generated successfully');

    } catch (error) {
      console.error('QR generation failed:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  }, [options, onGenerated]);

  // Create mock QR code (in real implementation, use proper QR library)
  const createMockQRCode = async (qrOptions: QRCodeOptions): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const sizeConfig = SIZE_CONFIGS[qrOptions.size as keyof typeof SIZE_CONFIGS];
      const actualSize = qrOptions.size === 'custom' ? (qrOptions.customSize || 256) : sizeConfig.size;
      const margin = qrOptions.margin * 2;
      
      canvas.width = actualSize + margin;
      canvas.height = actualSize + margin;
      
      // Background
      if (qrOptions.gradient?.enabled) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, qrOptions.gradient.startColor);
        gradient.addColorStop(1, qrOptions.gradient.endColor);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = qrOptions.backgroundColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // QR pattern (simplified mock)
      const moduleSize = Math.floor(actualSize / 25);
      ctx.fillStyle = qrOptions.foregroundColor;
      
      for (let x = 0; x < 25; x++) {
        for (let y = 0; y < 25; y++) {
          // Create a simple QR-like pattern
          const shouldFill = (x + y) % 3 === 0 || 
                            (x > 2 && x < 6 && y > 2 && y < 6) ||
                            (x > 18 && x < 22 && y > 2 && y < 6) ||
                            (x > 2 && x < 6 && y > 18 && y < 22);
          
          if (shouldFill) {
            const xPos = margin/2 + x * moduleSize;
            const yPos = margin/2 + y * moduleSize;
            
            if (qrOptions.style === 'rounded' || qrOptions.rounded) {
              // Draw rounded rectangles
              drawRoundedRect(ctx, xPos, yPos, moduleSize, moduleSize, moduleSize * qrOptions.roundedSize);
            } else if (qrOptions.style === 'dots') {
              // Draw dots
              ctx.beginPath();
              ctx.arc(xPos + moduleSize/2, yPos + moduleSize/2, (moduleSize * qrOptions.dotScale) / 2, 0, 2 * Math.PI);
              ctx.fill();
            } else {
              // Draw squares
              ctx.fillRect(xPos, yPos, moduleSize, moduleSize);
            }
          }
        }
      }
      
      // Add logo if enabled and provided
      if (qrOptions.logo?.enabled && logoDataUrl) {
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoSize = actualSize * (qrOptions.logo?.size || 0.15);
          const logoX = (canvas.width - logoSize) / 2;
          const logoY = (canvas.height - logoSize) / 2;
          
          if (qrOptions.logo?.background) {
            ctx.fillStyle = qrOptions.logo.backgroundColor;
            ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);
          }
          
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          resolve(canvas.toDataURL('image/png'));
        };
        logoImg.src = logoDataUrl;
      } else {
        resolve(canvas.toDataURL('image/png'));
      }
    });
  };

  // Helper function to draw rounded rectangles
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
  };

  // Handle logo upload
  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoDataUrl(result);
      updateNestedOption('logo', 'url', result);
    };
    reader.readAsDataURL(file);
  }, [updateNestedOption]);

  // Download QR code
  const downloadQRCode = useCallback(async () => {
    if (!generatedQR) {
      toast.error('Please generate a QR code first');
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = `qrcode_${Date.now()}.${options.format}`;
      link.href = generatedQR;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code downloaded');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  }, [generatedQR, options.format]);

  // Copy QR code to clipboard
  const copyQRCode = useCallback(async () => {
    if (!generatedQR) {
      toast.error('Please generate a QR code first');
      return;
    }

    try {
      // Convert data URL to blob
      const response = await fetch(generatedQR);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      
      toast.success('QR code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy QR code');
    }
  }, [generatedQR]);

  // Generate batch QR codes
  const generateBatchQRCodes = useCallback(async () => {
    const urls = batchUrls.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
      toast.error('Please enter URLs for batch generation');
      return;
    }

    setIsGenerating(true);
    const results: Array<{ url: string; qr: string; success: boolean }> = [];

    for (const url of urls) {
      try {
        const batchOptions = { ...options, data: url.trim() };
        const qr = await createMockQRCode(batchOptions);
        results.push({ url: url.trim(), qr, success: true });
      } catch (error) {
        results.push({ url: url.trim(), qr: '', success: false });
      }
    }

    setBatchResults(results);
    setIsGenerating(false);
    toast.success(`Generated ${results.filter(r => r.success).length} QR codes`);
  }, [batchUrls, options]);

  // Download all batch results
  const downloadAllBatch = useCallback(() => {
    const successfulResults = batchResults.filter(r => r.success);
    
    successfulResults.forEach((result, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `qrcode_${index + 1}.png`;
        link.href = result.qr;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 100); // Stagger downloads
    });
    
    toast.success(`Downloading ${successfulResults.length} QR codes`);
  }, [batchResults]);

  // Auto-generate when options change
  useEffect(() => {
    if (options.data) {
      const timeoutId = setTimeout(generateQRCode, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [options, generateQRCode]);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QR Code Generator</h2>
          <p className="text-muted-foreground">Create customizable QR codes for sharing</p>
        </div>
        
        <div className="flex gap-2">
          {generatedQR && (
            <>
              <Button variant="outline" size="sm" onClick={copyQRCode}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadQRCode}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">
                <Settings className="h-4 w-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="style">
                <Palette className="h-4 w-4 mr-2" />
                Style
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <QrCode className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
              {showBatch && (
                <TabsTrigger value="batch">
                  <FileCode className="h-4 w-4 mr-2" />
                  Batch
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* URL/Text Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="qr-data">URL or Text</Label>
                    <Textarea
                      id="qr-data"
                      placeholder="Enter URL or text to encode in QR code"
                      value={options.data}
                      onChange={(e) => updateOption('data', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="format">Format</Label>
                      <Select 
                        value={options.format} 
                        onValueChange={(value: QRCodeFormat) => updateOption('format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="svg">SVG</SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="size">Size</Label>
                      <Select 
                        value={options.size} 
                        onValueChange={(value: QRCodeSize) => updateOption('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(SIZE_CONFIGS).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {options.size === 'custom' && (
                    <div>
                      <Label htmlFor="custom-size">Custom Size (px)</Label>
                      <Input
                        id="custom-size"
                        type="number"
                        min="64"
                        max="2048"
                        value={options.customSize || 256}
                        onChange={(e) => updateOption('customSize', parseInt(e.target.value))}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="error-correction">Error Correction</Label>
                    <Select 
                      value={options.errorCorrection} 
                      onValueChange={(value: QRErrorCorrection) => updateOption('errorCorrection', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (~7%)</SelectItem>
                        <SelectItem value="medium">Medium (~15%)</SelectItem>
                        <SelectItem value="quartile">Quartile (~25%)</SelectItem>
                        <SelectItem value="high">High (~30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Presets */}
              {showPresets && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Presets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {QR_PRESETS.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                          className="justify-start h-auto p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-primary">{preset.icon}</div>
                            <div className="text-left">
                              <div className="font-medium text-sm">{preset.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {preset.description}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="style" className="space-y-6">
              {/* Style Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Visual Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="qr-style">QR Style</Label>
                    <Select 
                      value={options.style} 
                      onValueChange={(value: QRCodeStyle) => updateOption('style', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="dots">Dots</SelectItem>
                        <SelectItem value="classy">Classy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fg-color">Foreground Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="fg-color"
                          type="color"
                          value={options.foregroundColor}
                          onChange={(e) => updateOption('foregroundColor', e.target.value)}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={options.foregroundColor}
                          onChange={(e) => updateOption('foregroundColor', e.target.value)}
                          placeholder="#000000"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bg-color">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="bg-color"
                          type="color"
                          value={options.backgroundColor}
                          onChange={(e) => updateOption('backgroundColor', e.target.value)}
                          className="w-12 h-8 p-1 border rounded"
                        />
                        <Input
                          value={options.backgroundColor}
                          onChange={(e) => updateOption('backgroundColor', e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Gradient Options */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enable-gradient">Enable Gradient</Label>
                      <Switch
                        id="enable-gradient"
                        checked={options.gradient?.enabled || false}
                        onCheckedChange={(checked) => updateNestedOption('gradient', 'enabled', checked)}
                      />
                    </div>

                    {options.gradient?.enabled && (
                      <div className="space-y-3 mt-3 p-3 bg-muted rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Start Color</Label>
                            <Input
                              type="color"
                              value={options.gradient.startColor || '#3b82f6'}
                              onChange={(e) => updateNestedOption('gradient', 'startColor', e.target.value)}
                              className="w-full h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Color</Label>
                            <Input
                              type="color"
                              value={options.gradient.endColor || '#1d4ed8'}
                              onChange={(e) => updateNestedOption('gradient', 'endColor', e.target.value)}
                              className="w-full h-8"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Direction</Label>
                          <Select 
                            value={options.gradient.direction || 'diagonal'} 
                            onValueChange={(value) => updateNestedOption('gradient', 'direction', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="horizontal">Horizontal</SelectItem>
                              <SelectItem value="vertical">Vertical</SelectItem>
                              <SelectItem value="diagonal">Diagonal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Logo Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-logo">Add Logo</Label>
                    <Switch
                      id="enable-logo"
                      checked={options.logo?.enabled || false}
                      onCheckedChange={(checked) => updateNestedOption('logo', 'enabled', checked)}
                    />
                  </div>

                  {options.logo?.enabled && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="logo-upload">Upload Logo</Label>
                        <Input
                          ref={logoInputRef}
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </div>

                      {logoDataUrl && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <img src={logoDataUrl} alt="Logo preview" className="w-10 h-10 object-contain" />
                          <div className="text-sm text-muted-foreground">Logo uploaded</div>
                        </div>
                      )}

                      <div>
                        <Label>Logo Size: {((options.logo?.size || 0.15) * 100).toFixed(0)}%</Label>
                        <Slider
                          value={[options.logo?.size || 0.15]}
                          onValueChange={(value) => updateNestedOption('logo', 'size', value[0])}
                          max={0.3}
                          min={0.05}
                          step={0.01}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="logo-background">Background</Label>
                        <Switch
                          id="logo-background"
                          checked={options.logo?.background || false}
                          onCheckedChange={(checked) => updateNestedOption('logo', 'background', checked)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              {/* Advanced Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Advanced Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Margin: {options.margin}px</Label>
                    <Slider
                      value={[options.margin]}
                      onValueChange={(value) => updateOption('margin', value[0])}
                      max={20}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Quiet Zone: {options.quietZone}px</Label>
                    <Slider
                      value={[options.quietZone]}
                      onValueChange={(value) => updateOption('quietZone', value[0])}
                      max={10}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  {options.style === 'dots' && (
                    <div>
                      <Label>Dot Scale: {options.dotScale.toFixed(1)}</Label>
                      <Slider
                        value={[options.dotScale]}
                        onValueChange={(value) => updateOption('dotScale', value[0])}
                        max={1.5}
                        min={0.5}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="rounded-modules">Rounded Modules</Label>
                    <Switch
                      id="rounded-modules"
                      checked={options.rounded}
                      onCheckedChange={(checked) => updateOption('rounded', checked)}
                    />
                  </div>

                  {options.rounded && (
                    <div>
                      <Label>Corner Radius: {options.roundedSize.toFixed(1)}</Label>
                      <Slider
                        value={[options.roundedSize]}
                        onValueChange={(value) => updateOption('roundedSize', value[0])}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="qr-title">Title (optional)</Label>
                    <Input
                      id="qr-title"
                      value={options.title || ''}
                      onChange={(e) => updateOption('title', e.target.value)}
                      placeholder="QR Code Title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="qr-description">Description (optional)</Label>
                    <Textarea
                      id="qr-description"
                      value={options.description || ''}
                      onChange={(e) => updateOption('description', e.target.value)}
                      placeholder="QR Code Description"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {showBatch && (
              <TabsContent value="batch" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Batch Generation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="batch-urls">URLs (one per line)</Label>
                      <Textarea
                        id="batch-urls"
                        value={batchUrls}
                        onChange={(e) => setBatchUrls(e.target.value)}
                        placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"
                        rows={6}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={generateBatchQRCodes}
                        disabled={isGenerating || !batchUrls.trim()}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate Batch
                          </>
                        )}
                      </Button>

                      {batchResults.length > 0 && (
                        <Button 
                          variant="outline"
                          onClick={downloadAllBatch}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download All
                        </Button>
                      )}
                    </div>

                    {batchResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Results</Label>
                          <Badge variant="outline">
                            {batchResults.filter(r => r.success).length} / {batchResults.length} successful
                          </Badge>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {batchResults.map((result, index) => (
                            <div
                              key={index}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-lg border",
                                result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                              )}
                            >
                              {result.success && result.qr && (
                                <img src={result.qr} alt={`QR ${index + 1}`} className="w-8 h-8" />
                              )}
                              <div className="flex-1 text-sm">
                                <div className="font-medium truncate">{result.url}</div>
                              </div>
                              {result.success && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.download = `qrcode_${index + 1}.png`;
                                    link.href = result.qr;
                                    link.click();
                                  }}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                {generatedQR ? (
                  <>
                    <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                      <img
                        src={generatedQR}
                        alt="Generated QR Code"
                        className="max-w-full max-h-80 object-contain"
                      />
                    </div>

                    <div className="text-center space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {SIZE_CONFIGS[options.size as keyof typeof SIZE_CONFIGS]?.label} • {options.format.toUpperCase()}
                      </div>
                      
                      {options.title && (
                        <div className="font-medium">{options.title}</div>
                      )}
                      
                      {options.description && (
                        <div className="text-sm text-muted-foreground">{options.description}</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
                    <QrCode className="h-16 w-16 mb-4 opacity-50" />
                    <p>Enter content to generate QR code</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {generatedQR && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" onClick={copyQRCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Image
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={downloadQRCode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: options.title || 'QR Code',
                          files: [new File([generatedQR], 'qrcode.png', { type: 'image/png' })]
                        });
                      } else {
                        copyQRCode();
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden canvas for QR generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}