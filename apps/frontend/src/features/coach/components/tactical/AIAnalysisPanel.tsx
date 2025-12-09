'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Users,
  Zap,
  Eye,
  BarChart3,
  Lightbulb,
  FileText,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types for AI Analysis
interface AnalysisScore {
  overall: number;
  categories: {
    spacing: number;
    timing: number;
    positioning: number;
    flow: number;
    creativity: number;
    effectiveness: number;
  };
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'spacing' | 'timing' | 'positioning' | 'flow' | 'creativity' | 'effectiveness';
  priority: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'hard';
  expectedImprovement: number;
  coordinates?: { x: number; y: number };
  beforeAfter?: {
    before: string;
    after: string;
  };
}

interface PatternRecognition {
  detectedFormation: {
    name: string;
    confidence: number;
    description: string;
  };
  similarPlays: Array<{
    id: string;
    name: string;
    matchScore: number;
    thumbnail: string;
  }>;
  commonMistakes: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    frequency: number;
  }>;
}

interface CounterPlay {
  defensiveFormations: Array<{
    name: string;
    effectiveness: number;
    description: string;
  }>;
  vulnerabilities: Array<{
    area: string;
    risk: number;
    description: string;
    coordinates: { x: number; y: number };
  }>;
  riskAssessment: {
    overall: number;
    breakdown: {
      turnover: number;
      counterAttack: number;
      coverage: number;
    };
  };
}

interface AnalysisHistory {
  id: string;
  timestamp: Date;
  playName: string;
  score: AnalysisScore;
  suggestionsCount: number;
  type: 'quick' | 'detailed' | 'comparative';
}

interface AIAnalysisPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  isDocked: boolean;
  onDockToggle: () => void;
  currentPlay: any; // Replace with actual play type
  onHighlightArea: (coordinates: { x: number; y: number }) => void;
  onApplySuggestion: (suggestion: Suggestion) => void;
}

// Score Display Component
const ScoreDisplay: React.FC<{ score: AnalysisScore }> = ({ score }) => {
  const getScoreColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (value: number) => {
    if (value >= 70) return 'stroke-green-600';
    if (value >= 40) return 'stroke-yellow-600';
    return 'stroke-red-600';
  };

  const TrendIcon = score.trend === 'up' ? TrendingUp : score.trend === 'down' ? TrendingDown : Target;

  return (
    <div className="space-y-4">
      {/* Overall Score Circle */}
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${score.overall * 3.14159} ${314.159}`}
              className={getScoreBackground(score.overall)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor(score.overall)}`}>
              {score.overall}
            </span>
            <span className="text-sm text-gray-500">Overall</span>
          </div>
        </div>
      </div>

      {/* Trend and Confidence */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-4 h-4 ${getScoreColor(score.overall)}`} />
          <span className="capitalize">{score.trend}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-500">Confidence:</span>
          <span className="font-medium">{score.confidence}%</span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Category Breakdown</h4>
        {Object.entries(score.categories).map(([category, value]) => (
          <div key={category} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{category}</span>
              <span className={`font-medium ${getScoreColor(value)}`}>{value}</span>
            </div>
            <Progress value={value} className="h-2" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Suggestions Component
const SuggestionsComponent: React.FC<{
  suggestions: Suggestion[];
  onHighlightArea: (coordinates: { x: number; y: number }) => void;
  onApplySuggestion: (suggestion: Suggestion) => void;
}> = ({ suggestions, onHighlightArea, onApplySuggestion }) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'moderate': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'hard': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Suggestions</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show Comparison</span>
          <Switch
            checked={showComparison}
            onCheckedChange={setShowComparison}
          />
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Card 
              key={suggestion.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedSuggestion === suggestion.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedSuggestion(suggestion.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(suggestion.priority)} variant="outline">
                        {suggestion.priority}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {getDifficultyIcon(suggestion.difficulty)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Difficulty: {suggestion.difficulty}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Expected Improvement */}
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-600">Expected improvement:</span>
                    <span className="text-sm font-medium text-green-600">+{suggestion.expectedImprovement} points</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {suggestion.coordinates && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onHighlightArea(suggestion.coordinates!);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Highlight
                        </Button>
                      )}
                      {showComparison && suggestion.beforeAfter && (
                        <Button size="sm" variant="outline">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          Compare
                        </Button>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplySuggestion(suggestion);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// Pattern Recognition Display
const PatternRecognitionDisplay: React.FC<{ patterns: PatternRecognition }> = ({ patterns }) => {
  return (
    <div className="space-y-6">
      {/* Detected Formation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Detected Formation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{patterns.detectedFormation.name}</h4>
              <Badge variant="secondary">
                {patterns.detectedFormation.confidence}% confidence
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{patterns.detectedFormation.description}</p>
            <Progress value={patterns.detectedFormation.confidence} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Similar Plays */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Similar Plays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patterns.similarPlays.map((play) => (
              <div key={play.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs">IMG</span>
                  </div>
                  <div>
                    <h5 className="font-medium">{play.name}</h5>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">Match:</span>
                      <span className="text-sm font-medium">{play.matchScore}%</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Mistakes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Common Mistakes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patterns.commonMistakes.map((mistake, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{mistake.type}</h5>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={mistake.severity === 'high' ? 'destructive' : 
                              mistake.severity === 'medium' ? 'secondary' : 'outline'}
                    >
                      {mistake.severity}
                    </Badge>
                    <span className="text-sm text-gray-600">{mistake.frequency}% frequency</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{mistake.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Counter-Play Component
const CounterPlayComponent: React.FC<{ counterPlay: CounterPlay }> = ({ counterPlay }) => {
  return (
    <div className="space-y-6">
      {/* Defensive Formations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recommended Defensive Formations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {counterPlay.defensiveFormations.map((formation, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{formation.name}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Effectiveness:</span>
                    <span className="text-sm font-medium text-green-600">{formation.effectiveness}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{formation.description}</p>
                <Progress value={formation.effectiveness} className="h-2 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Risk</span>
              <span className="text-lg font-bold text-orange-600">{counterPlay.riskAssessment.overall}%</span>
            </div>
            <Progress value={counterPlay.riskAssessment.overall} className="h-3" />
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-700">Risk Breakdown</h5>
              {Object.entries(counterPlay.riskAssessment.breakdown).map(([risk, value]) => (
                <div key={risk} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{risk} Risk:</span>
                  <span className="text-sm font-medium">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Identified Vulnerabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {counterPlay.vulnerabilities.map((vulnerability, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{vulnerability.area}</h5>
                  <Badge variant={vulnerability.risk > 70 ? 'destructive' : 
                                  vulnerability.risk > 40 ? 'secondary' : 'outline'}>
                    {vulnerability.risk}% risk
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{vulnerability.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Analysis History Component
const AnalysisHistoryComponent: React.FC<{ 
  history: AnalysisHistory[];
  onCompareAnalyses: (id1: string, id2: string) => void;
}> = ({ history, onCompareAnalyses }) => {
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);

  const handleSelectionToggle = (id: string) => {
    setSelectedAnalyses(prev => 
      prev.includes(id) 
        ? prev.filter(analysisId => analysisId !== id)
        : prev.length < 2 
          ? [...prev, id]
          : [prev[1], id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analysis History</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={selectedAnalyses.length !== 2}
            onClick={() => onCompareAnalyses(selectedAnalyses[0], selectedAnalyses[1])}
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Compare ({selectedAnalyses.length}/2)
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1" />
            Export Report
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {history.map((analysis) => (
            <Card 
              key={analysis.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedAnalyses.includes(analysis.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleSelectionToggle(analysis.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{analysis.playName}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        {analysis.timestamp.toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {analysis.type}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {analysis.suggestionsCount} suggestions
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      analysis.score.overall >= 70 ? 'text-green-600' :
                      analysis.score.overall >= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysis.score.overall}
                    </div>
                    <div className="text-xs text-gray-500">Overall Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// Main AI Analysis Panel Component
export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  isOpen,
  onToggle,
  isDocked,
  onDockToggle,
  currentPlay,
  onHighlightArea,
  onApplySuggestion
}) => {
  const [analysisType, setAnalysisType] = useState<'quick' | 'detailed' | 'comparative'>('quick');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<{
    score: AnalysisScore;
    suggestions: Suggestion[];
    patterns: PatternRecognition;
    counterPlay: CounterPlay;
    history: AnalysisHistory[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState('score');
  const [isMaximized, setIsMaximized] = useState(false);

  // Mock analysis function
  const performAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data
    const mockData = {
      score: {
        overall: 73,
        categories: {
          spacing: 78,
          timing: 68,
          positioning: 75,
          flow: 72,
          creativity: 80,
          effectiveness: 69
        },
        confidence: 87,
        trend: 'up' as const
      },
      suggestions: [
        {
          id: '1',
          title: 'Improve Forward Spacing',
          description: 'Left wing is too close to center, reducing passing options',
          category: 'spacing' as const,
          priority: 'high' as const,
          difficulty: 'easy' as const,
          expectedImprovement: 8,
          coordinates: { x: 150, y: 200 }
        },
        {
          id: '2',
          title: 'Optimize Entry Timing',
          description: 'Delay the dump-in by 0.5 seconds for better support',
          category: 'timing' as const,
          priority: 'medium' as const,
          difficulty: 'moderate' as const,
          expectedImprovement: 5,
          coordinates: { x: 300, y: 150 }
        },
        {
          id: '3',
          title: 'Adjust Defensive Positioning',
          description: 'Right defenseman should shift wider to cover the point',
          category: 'positioning' as const,
          priority: 'medium' as const,
          difficulty: 'easy' as const,
          expectedImprovement: 6,
          coordinates: { x: 400, y: 300 }
        }
      ],
      patterns: {
        detectedFormation: {
          name: '1-2-2 Forecheck',
          confidence: 82,
          description: 'Aggressive forechecking pattern with one forward pressuring the puck'
        },
        similarPlays: [
          {
            id: 'play1',
            name: 'Power Play Entry #3',
            matchScore: 89,
            thumbnail: 'thumb1.jpg'
          },
          {
            id: 'play2',
            name: 'Even Strength Rush',
            matchScore: 76,
            thumbnail: 'thumb2.jpg'
          }
        ],
        commonMistakes: [
          {
            type: 'Overcrowded Slot',
            severity: 'medium' as const,
            description: 'Multiple players converging in scoring area',
            frequency: 34
          },
          {
            type: 'Late Support',
            severity: 'high' as const,
            description: 'Trailing players arriving too late for rebound',
            frequency: 28
          }
        ]
      },
      counterPlay: {
        defensiveFormations: [
          {
            name: '1-3-1 Neutral Zone Trap',
            effectiveness: 78,
            description: 'Strong counter to aggressive forechecking'
          },
          {
            name: 'Box Plus One',
            effectiveness: 65,
            description: 'Good for protecting the slot area'
          }
        ],
        vulnerabilities: [
          {
            area: 'Weak Side Coverage',
            risk: 72,
            description: 'Exposed to quick passes to the off-wing',
            coordinates: { x: 450, y: 180 }
          },
          {
            area: 'Rebound Control',
            risk: 68,
            description: 'Limited presence around the net for loose pucks',
            coordinates: { x: 500, y: 250 }
          }
        ],
        riskAssessment: {
          overall: 58,
          breakdown: {
            turnover: 62,
            counterAttack: 54,
            coverage: 58
          }
        }
      },
      history: [
        {
          id: 'hist1',
          timestamp: new Date(),
          playName: 'Power Play Entry',
          score: {
            overall: 73,
            categories: {
              spacing: 78,
              timing: 68,
              positioning: 75,
              flow: 72,
              creativity: 80,
              effectiveness: 69
            },
            confidence: 87,
            trend: 'up' as const
          },
          suggestionsCount: 3,
          type: 'detailed' as const
        }
      ]
    };

    setAnalysisData(mockData);
    setIsAnalyzing(false);
  };

  const handleCompareAnalyses = (id1: string, id2: string) => {
    console.log('Comparing analyses:', id1, id2);
    // Implement comparison logic
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed right-0 top-0 h-full bg-white shadow-xl border-l z-50 transition-all duration-300
      ${isDocked ? 'w-96' : 'w-full max-w-4xl'}
      ${isMaximized ? 'w-full' : ''}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold">AI Tactical Analysis</h2>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMaximized(!isMaximized)}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isMaximized ? 'Minimize' : 'Maximize'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDockToggle}
                >
                  {isDocked ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDocked ? 'Undock Panel' : 'Dock Panel'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button size="sm" variant="ghost" onClick={onToggle}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Analysis Controls */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Analysis Type
            </label>
            <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick Analysis</SelectItem>
                <SelectItem value="detailed">Detailed Analysis</SelectItem>
                <SelectItem value="comparative">Comparative Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button 
              onClick={performAnalysis}
              disabled={isAnalyzing}
              className="min-w-[120px]"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {analysisData && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export PDF
            </Button>
            <Button size="sm" variant="outline">
              <FileText className="w-4 h-4 mr-1" />
              Save Report
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </Button>
          </div>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-hidden">
        {!analysisData ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Click "Analyze" to get AI insights on your tactical play</p>
              <p className="text-sm mt-2">Select your preferred analysis type above</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-5 mx-4 mt-4">
              <TabsTrigger value="score" className="text-xs">Score</TabsTrigger>
              <TabsTrigger value="suggestions" className="text-xs">Suggestions</TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs">Patterns</TabsTrigger>
              <TabsTrigger value="counter" className="text-xs">Counter-Play</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="score" className="mt-0 h-full">
                <ScrollArea className="h-full px-4">
                  <div className="py-4">
                    <ScoreDisplay score={analysisData.score} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="suggestions" className="mt-0 h-full">
                <ScrollArea className="h-full px-4">
                  <div className="py-4">
                    <SuggestionsComponent 
                      suggestions={analysisData.suggestions}
                      onHighlightArea={onHighlightArea}
                      onApplySuggestion={onApplySuggestion}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="patterns" className="mt-0 h-full">
                <ScrollArea className="h-full px-4">
                  <div className="py-4">
                    <PatternRecognitionDisplay patterns={analysisData.patterns} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="counter" className="mt-0 h-full">
                <ScrollArea className="h-full px-4">
                  <div className="py-4">
                    <CounterPlayComponent counterPlay={analysisData.counterPlay} />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="mt-0 h-full">
                <ScrollArea className="h-full px-4">
                  <div className="py-4">
                    <AnalysisHistoryComponent 
                      history={analysisData.history}
                      onCompareAnalyses={handleCompareAnalyses}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;