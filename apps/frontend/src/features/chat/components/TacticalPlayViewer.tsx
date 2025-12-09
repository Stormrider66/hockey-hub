'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Eye,
  MessageCircle,
  Share2,
  Download,
  X,
  Target,
  Users,
  Clock,
  FileText
} from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import { TacticalPlayData } from '../../coach/services/tacticalCommunicationService';

interface TacticalPlayViewerProps {
  isOpen: boolean;
  onClose: () => void;
  play: TacticalPlayData | null;
  allowComments?: boolean;
  onStartDiscussion?: () => void;
  onShare?: () => void;
  showMetadata?: boolean;
}

export default function TacticalPlayViewer({
  isOpen,
  onClose,
  play,
  allowComments = true,
  onStartDiscussion,
  onShare,
  showMetadata = true
}: TacticalPlayViewerProps) {
  const { t } = useTranslation(['chat', 'coach']);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [panMode, setPanMode] = useState(false);
  
  if (!play) return null;

  // Mock animation steps for demonstration
  const animationSteps = [
    { step: 0, description: 'Initial formation - players take position' },
    { step: 1, description: 'Center wins faceoff, passes to defenseman' },
    { step: 2, description: 'D-to-D pass to create space' },
    { step: 3, description: 'Breakout pass to winger' },
    { step: 4, description: 'Entry into attacking zone' }
  ];

  // Play animation
  const handlePlayAnimation = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // Mock animation loop
      let step = currentStep;
      const interval = setInterval(() => {
        step++;
        if (step >= animationSteps.length) {
          step = 0;
        }
        setCurrentStep(step);
      }, 2000);

      setTimeout(() => {
        clearInterval(interval);
        setIsPlaying(false);
      }, animationSteps.length * 2000);
    } else {
      setIsPlaying(false);
    }
  };

  // Get category styling
  const getCategoryStyles = () => {
    switch (play.category) {
      case 'offensive':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-100' };
      case 'defensive':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-100' };
      case 'special-teams':
        return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100' };
      case 'faceoff':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100' };
      case 'transition':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-100' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-100' };
    }
  };

  const styles = getCategoryStyles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Play className="h-6 w-6" />
                {play.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Interactive tactical play viewer with step-by-step animation
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {allowComments && onStartDiscussion && (
                <Button size="sm" variant="outline" onClick={onStartDiscussion}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Discuss
                </Button>
              )}
              {onShare && (
                <Button size="sm" variant="outline" onClick={onShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Play View */}
          <div className="flex-1 flex flex-col">
            {/* Play Controls */}
            <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePlayAnimation}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-1" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(0);
                    setIsPlaying(false);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>

                <div className="w-px h-6 bg-border mx-2" />

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <span className="text-sm font-mono min-w-12 text-center">
                  {zoom}%
                </span>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>

                <Button 
                  size="sm" 
                  variant={panMode ? "default" : "outline"}
                  onClick={() => setPanMode(!panMode)}
                >
                  <Move className="h-4 w-4 mr-1" />
                  Pan
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Step:</span>
                <Badge variant="outline">
                  {currentStep + 1} / {animationSteps.length}
                </Badge>
              </div>
            </div>

            {/* Tactical Board Display */}
            <div className="flex-1 relative overflow-hidden bg-green-100">
              <div 
                className="absolute inset-0 transition-transform duration-300"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
              >
                {/* Mock Hockey Rink */}
                <svg className="w-full h-full" viewBox="0 0 800 400">
                  {/* Rink outline */}
                  <rect 
                    x="50" 
                    y="50" 
                    width="700" 
                    height="300" 
                    fill="white" 
                    stroke="#1e40af" 
                    strokeWidth="3"
                    rx="20"
                  />
                  
                  {/* Center line */}
                  <line x1="400" y1="50" x2="400" y2="350" stroke="#1e40af" strokeWidth="2" />
                  
                  {/* Center circle */}
                  <circle cx="400" cy="200" r="30" fill="none" stroke="#1e40af" strokeWidth="2" />
                  
                  {/* Goals */}
                  <rect x="50" y="170" width="15" height="60" fill="none" stroke="#ef4444" strokeWidth="2" />
                  <rect x="735" y="170" width="15" height="60" fill="none" stroke="#ef4444" strokeWidth="2" />

                  {/* Mock player positions - these would be dynamic based on play data */}
                  {play.category === 'offensive' && (
                    <g>
                      {/* Attacking team (blue) */}
                      <circle cx={150 + currentStep * 30} cy="200" r="12" fill="#3b82f6" stroke="white" strokeWidth="2" />
                      <text x={150 + currentStep * 30} y="205" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">C</text>
                      
                      <circle cx={120 + currentStep * 25} cy="170" r="12" fill="#3b82f6" stroke="white" strokeWidth="2" />
                      <text x={120 + currentStep * 25} y="175" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">LW</text>
                      
                      <circle cx={120 + currentStep * 25} cy="230" r="12" fill="#3b82f6" stroke="white" strokeWidth="2" />
                      <text x={120 + currentStep * 25} y="235" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">RW</text>
                      
                      <circle cx={80 + currentStep * 20} cy="180" r="12" fill="#3b82f6" stroke="white" strokeWidth="2" />
                      <text x={80 + currentStep * 20} y="185" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
                      
                      <circle cx={80 + currentStep * 20} cy="220" r="12" fill="#3b82f6" stroke="white" strokeWidth="2" />
                      <text x={80 + currentStep * 20} y="225" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>

                      {/* Movement arrows */}
                      {currentStep > 0 && (
                        <g>
                          <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                            </marker>
                          </defs>
                          <line 
                            x1={150 + (currentStep - 1) * 30} 
                            y1="200" 
                            x2={150 + currentStep * 30} 
                            y2="200" 
                            stroke="#3b82f6" 
                            strokeWidth="2" 
                            markerEnd="url(#arrowhead)"
                          />
                        </g>
                      )}
                    </g>
                  )}

                  {/* Defensive positioning for defensive plays */}
                  {play.category === 'defensive' && (
                    <g>
                      {/* Defending team (red) */}
                      <circle cx="300" cy="200" r="12" fill="#ef4444" stroke="white" strokeWidth="2" />
                      <text x="300" y="205" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">C</text>
                      
                      <circle cx="250" cy="180" r="12" fill="#ef4444" stroke="white" strokeWidth="2" />
                      <text x="250" y="185" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
                      
                      <circle cx="250" cy="220" r="12" fill="#ef4444" stroke="white" strokeWidth="2" />
                      <text x="250" y="225" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
                    </g>
                  )}
                </svg>

                {/* Animation step overlay */}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg max-w-sm">
                  <div className="font-medium mb-1">Step {currentStep + 1}</div>
                  <div className="text-sm">{animationSteps[currentStep].description}</div>
                </div>
              </div>
            </div>

            {/* Animation Timeline */}
            <div className="p-4 bg-muted/30 border-t">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Animation Steps:</span>
                {isPlaying && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    Playing...
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {animationSteps.map((step, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={index === currentStep ? "default" : "outline"}
                    onClick={() => {
                      setCurrentStep(index);
                      setIsPlaying(false);
                    }}
                    className="min-w-0 shrink-0"
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel with Play Information */}
          {showMetadata && (
            <div className="w-80 border-l bg-muted/20">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Play Metadata */}
                  <Card className={`${styles.bg} border ${styles.border}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`${styles.badge} ${styles.text}`}>
                          {play.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {play.formation}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Situation:</span>
                          <span className="font-medium">{play.situation}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Formation:</span>
                          <span className="font-medium">{play.formation}</span>
                        </div>

                        {play.description && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">{play.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  {play.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {play.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Points */}
                  <div>
                    <h3 className="font-medium mb-3">Key Coaching Points</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 border-l-4 border-l-blue-500 text-sm">
                        <div className="font-medium mb-1">Timing</div>
                        <div className="text-muted-foreground">
                          Watch for the initial pass timing and support positioning
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 border-l-4 border-l-green-500 text-sm">
                        <div className="font-medium mb-1">Spacing</div>
                        <div className="text-muted-foreground">
                          Maintain proper lanes and create passing options
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 border-l-4 border-l-orange-500 text-sm">
                        <div className="font-medium mb-1">Communication</div>
                        <div className="text-muted-foreground">
                          Call for the puck early and signal intent
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => window.print()}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Diagram
                    </Button>
                    
                    {allowComments && (
                      <Button variant="outline" className="w-full" onClick={onStartDiscussion}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Discussion
                      </Button>
                    )}
                  </div>

                  {/* Quick Reference */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <h4 className="font-medium text-sm mb-2">Controls:</h4>
                    <div>• Click Play to animate the sequence</div>
                    <div>• Use zoom controls to get closer view</div>
                    <div>• Click step numbers to jump to specific moments</div>
                    <div>• Pan mode lets you drag the view around</div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}