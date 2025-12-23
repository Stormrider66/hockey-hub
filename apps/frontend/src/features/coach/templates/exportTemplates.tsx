import React from 'react';
import {
  FileText,
  BookOpen,
  BarChart3,
  Users,
  Trophy,
  Target,
  Brain,
  Zap,
  TrendingUp,
  Shield,
  Activity,
  MapPin,
  Clock,
  Star,
  Gamepad2,
  Video,
  Camera,
  FileSpreadsheet,
  Presentation,
  Award,
  Calendar,
  MessageSquare,
  Settings,
  Eye,
  Printer
} from '@/components/icons';
import { ExportOptions } from '../services/exportService';

// Template categories
export type TemplateCategory = 
  | 'practice' 
  | 'game-analysis' 
  | 'player-development' 
  | 'team-management' 
  | 'scouting' 
  | 'presentation'
  | 'reports';

// Template interface
export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: React.ReactNode;
  options: Partial<ExportOptions>;
  features: string[];
  tags: string[];
  isPopular?: boolean;
  isPremium?: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  fileSize: 'small' | 'medium' | 'large';
  compatibility: string[];
  preview?: string;
  tutorial?: string;
  version: string;
  author: string;
  lastUpdated: Date;
  usageCount?: number;
  rating?: number;
  customFields?: CustomField[];
}

// Custom fields for advanced templates
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date' | 'color' | 'file';
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Pre-built export templates
export const exportTemplates: ExportTemplate[] = [
  // Practice Templates
  {
    id: 'practice-plan-basic',
    name: 'Basic Practice Plan',
    description: 'Simple practice plan with plays and drills',
    category: 'practice',
    icon: <Calendar className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'practice-plan',
      pageSize: 'A4',
      orientation: 'portrait',
      includeMetadata: true,
      includeNotes: true,
      includePlayerInstructions: true,
      includeDiagrams: true,
      coverPage: true,
      pageNumbers: true,
      customBranding: {
        coachName: '',
        teamName: '',
        organizationName: ''
      }
    },
    features: ['Cover page', 'Player instructions', 'Drill timing', 'Equipment list'],
    tags: ['practice', 'basic', 'coaching', 'drills'],
    isPopular: true,
    difficulty: 'beginner',
    estimatedTime: '2-3 minutes',
    fileSize: 'small',
    compatibility: ['PDF', 'Print'],
    version: '1.0',
    author: 'Hockey Hub',
    lastUpdated: new Date('2024-01-15')
  },
  
  {
    id: 'practice-plan-advanced',
    name: 'Advanced Practice Plan',
    description: 'Comprehensive practice plan with analytics and performance tracking',
    category: 'practice',
    icon: <TrendingUp className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'practice-plan',
      pageSize: 'A4',
      orientation: 'portrait',
      includeMetadata: true,
      includeNotes: true,
      includeStatistics: true,
      includePlayerInstructions: true,
      includeAnalytics: true,
      includeDiagrams: true,
      coverPage: true,
      tableOfContents: true,
      pageNumbers: true,
      sectionDividers: true,
      customSections: [
        {
          id: 'warmup',
          title: 'Warm-up Protocol',
          content: 'Dynamic stretching and basic skating drills',
          position: 'before-plays'
        },
        {
          id: 'cooldown',
          title: 'Cool-down Activities',
          content: 'Recovery stretches and team discussion',
          position: 'after-plays'
        }
      ]
    },
    features: ['Analytics', 'Player tracking', 'Performance metrics', 'Custom sections', 'TOC'],
    tags: ['practice', 'advanced', 'analytics', 'tracking'],
    difficulty: 'advanced',
    estimatedTime: '5-7 minutes',
    fileSize: 'large',
    compatibility: ['PDF', 'Print', 'Digital'],
    isPremium: true,
    version: '2.1',
    author: 'Hockey Hub Pro',
    lastUpdated: new Date('2024-01-20')
  },

  // Game Analysis Templates
  {
    id: 'game-analysis-summary',
    name: 'Game Analysis Summary',
    description: 'Post-game analysis with key plays and statistics',
    category: 'game-analysis',
    icon: <BarChart3 className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'game-analysis',
      pageSize: 'A4',
      orientation: 'landscape',
      includeMetadata: true,
      includeNotes: true,
      includeStatistics: true,
      includeAnalytics: true,
      includeDiagrams: true,
      includeVideoScreenshots: true,
      coverPage: true,
      pageNumbers: true,
      customSections: [
        {
          id: 'game-overview',
          title: 'Game Overview',
          content: 'Score, key moments, and overall performance',
          position: 'before-plays'
        },
        {
          id: 'improvement-areas',
          title: 'Areas for Improvement',
          content: 'Tactical adjustments and focus areas for next practice',
          position: 'after-plays'
        }
      ]
    },
    features: ['Video screenshots', 'Statistics', 'Performance analysis', 'Key moments'],
    tags: ['game', 'analysis', 'statistics', 'video'],
    isPopular: true,
    difficulty: 'intermediate',
    estimatedTime: '4-6 minutes',
    fileSize: 'medium',
    compatibility: ['PDF', 'Digital', 'Presentation'],
    version: '1.5',
    author: 'Hockey Hub',
    lastUpdated: new Date('2024-01-18')
  },

  {
    id: 'scouting-report',
    name: 'Opposition Scouting Report',
    description: 'Detailed scouting report for upcoming opponents',
    category: 'scouting',
    icon: <Eye className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'custom',
      pageSize: 'A4',
      orientation: 'portrait',
      includeMetadata: true,
      includeNotes: true,
      includeStatistics: true,
      includeAnalytics: true,
      includeDiagrams: true,
      coverPage: true,
      tableOfContents: true,
      pageNumbers: true,
      watermark: 'CONFIDENTIAL'
    },
    features: ['Opposition analysis', 'Strengths/weaknesses', 'Key players', 'Tactical setup'],
    tags: ['scouting', 'analysis', 'opposition', 'tactics'],
    difficulty: 'advanced',
    estimatedTime: '6-10 minutes',
    fileSize: 'large',
    compatibility: ['PDF', 'Print'],
    isPremium: true,
    version: '1.0',
    author: 'Pro Scout',
    lastUpdated: new Date('2024-01-10')
  },

  // Player Development Templates
  {
    id: 'player-development-plan',
    name: 'Individual Development Plan',
    description: 'Personalized development plan for individual players',
    category: 'player-development',
    icon: <Target className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'player-development',
      pageSize: 'A4',
      orientation: 'portrait',
      includeMetadata: true,
      includeNotes: true,
      includeStatistics: true,
      includePlayerInstructions: true,
      includeAnalytics: true,
      includeDiagrams: true,
      coverPage: true,
      pageNumbers: true,
      customSections: [
        {
          id: 'goals',
          title: 'Development Goals',
          content: 'Short-term and long-term objectives',
          position: 'before-plays'
        },
        {
          id: 'timeline',
          title: 'Development Timeline',
          content: 'Milestone tracking and progress indicators',
          position: 'after-plays'
        }
      ]
    },
    features: ['Goal setting', 'Progress tracking', 'Skill assessment', 'Personalized drills'],
    tags: ['development', 'individual', 'goals', 'progress'],
    difficulty: 'intermediate',
    estimatedTime: '4-5 minutes',
    fileSize: 'medium',
    compatibility: ['PDF', 'Print', 'Digital'],
    version: '1.2',
    author: 'Development Coach',
    lastUpdated: new Date('2024-01-12')
  },

  {
    id: 'team-skills-assessment',
    name: 'Team Skills Assessment',
    description: 'Comprehensive skills evaluation for the entire team',
    category: 'player-development',
    icon: <Users className="h-4 w-4" />,
    options: {
      format: 'excel',
      includeStatistics: true,
      includeAnalytics: true,
      multipleSheets: true,
      includeCharts: true,
      customSheets: [
        {
          name: 'Skating Skills',
          data: [],
          headers: ['Player', 'Speed', 'Agility', 'Backwards', 'Stopping', 'Overall'],
          chartType: 'bar'
        },
        {
          name: 'Stick Skills',
          data: [],
          headers: ['Player', 'Shooting', 'Passing', 'Stickhandling', 'Receiving', 'Overall'],
          chartType: 'radar'
        }
      ]
    },
    features: ['Multiple skill categories', 'Visual charts', 'Team comparison', 'Progress tracking'],
    tags: ['assessment', 'skills', 'team', 'evaluation'],
    difficulty: 'intermediate',
    estimatedTime: '3-4 minutes',
    fileSize: 'medium',
    compatibility: ['Excel', 'CSV', 'Charts'],
    version: '2.0',
    author: 'Skills Coach',
    lastUpdated: new Date('2024-01-16')
  },

  // Team Management Templates
  {
    id: 'playbook-complete',
    name: 'Complete Team Playbook',
    description: 'Comprehensive playbook with all team plays and strategies',
    category: 'team-management',
    icon: <BookOpen className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'playbook',
      pageSize: 'A4',
      orientation: 'landscape',
      includeMetadata: true,
      includeNotes: true,
      includeStatistics: true,
      includePlayerInstructions: true,
      includeAnalytics: true,
      includeDiagrams: true,
      includeAnimationFrames: true,
      coverPage: true,
      tableOfContents: true,
      playIndex: true,
      pageNumbers: true,
      sectionDividers: true,
      compression: true
    },
    features: ['All plays', 'Categories', 'Index', 'Animation frames', 'Statistics'],
    tags: ['playbook', 'complete', 'strategies', 'comprehensive'],
    isPopular: true,
    difficulty: 'intermediate',
    estimatedTime: '8-12 minutes',
    fileSize: 'large',
    compatibility: ['PDF', 'Print', 'Digital'],
    version: '3.0',
    author: 'Hockey Hub',
    lastUpdated: new Date('2024-01-22')
  },

  {
    id: 'seasonal-plan',
    name: 'Season Planning Guide',
    description: 'Long-term seasonal planning with periodization',
    category: 'team-management',
    icon: <Calendar className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'custom',
      pageSize: 'A3',
      orientation: 'landscape',
      includeMetadata: true,
      includeNotes: true,
      includeAnalytics: true,
      coverPage: true,
      tableOfContents: true,
      pageNumbers: true,
      customSections: [
        {
          id: 'preseason',
          title: 'Pre-season Preparation',
          content: 'Conditioning, skill development, and team building',
          position: 'before-plays'
        },
        {
          id: 'regular-season',
          title: 'Regular Season Focus',
          content: 'Game strategies, tactical development, and maintenance',
          position: 'before-plays'
        },
        {
          id: 'playoffs',
          title: 'Playoff Preparation',
          content: 'Peak performance and tournament strategies',
          position: 'after-plays'
        }
      ]
    },
    features: ['Periodization', 'Goal tracking', 'Timeline', 'Milestone planning'],
    tags: ['planning', 'season', 'periodization', 'goals'],
    difficulty: 'advanced',
    estimatedTime: '10-15 minutes',
    fileSize: 'large',
    compatibility: ['PDF', 'Print'],
    isPremium: true,
    version: '1.0',
    author: 'Strategic Coach',
    lastUpdated: new Date('2024-01-05')
  },

  // Presentation Templates
  {
    id: 'tactical-presentation',
    name: 'Tactical Presentation',
    description: 'Professional presentation for team meetings or coaching clinics',
    category: 'presentation',
    icon: <Presentation className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'custom',
      pageSize: 'A4',
      orientation: 'landscape',
      includeMetadata: false,
      includeNotes: false,
      includeDiagrams: true,
      includeVideoScreenshots: true,
      coverPage: true,
      pageNumbers: false,
      customBranding: {
        teamLogo: '',
        colors: {
          primary: '#1f2937',
          secondary: '#3b82f6'
        }
      },
      templateCustomization: {
        headerStyle: 'minimal',
        layoutStyle: 'spacious',
        diagramSize: 'large',
        fontSizes: {
          title: 24,
          heading: 18,
          body: 14,
          caption: 10
        }
      }
    },
    features: ['Large diagrams', 'Clean layout', 'Minimal text', 'Team branding'],
    tags: ['presentation', 'meeting', 'visual', 'professional'],
    difficulty: 'intermediate',
    estimatedTime: '3-5 minutes',
    fileSize: 'medium',
    compatibility: ['PDF', 'Screen', 'Projector'],
    version: '1.1',
    author: 'Presentation Pro',
    lastUpdated: new Date('2024-01-14')
  },

  // Reports Templates
  {
    id: 'performance-report',
    name: 'Team Performance Report',
    description: 'Detailed performance analytics and insights',
    category: 'reports',
    icon: <TrendingUp className="h-4 w-4" />,
    options: {
      format: 'excel',
      includeStatistics: true,
      includeAnalytics: true,
      includeCharts: true,
      multipleSheets: true,
      customSheets: [
        {
          name: 'Executive Summary',
          data: [],
          headers: ['Metric', 'Current Value', 'Previous Value', 'Change', 'Trend']
        },
        {
          name: 'Player Statistics',
          data: [],
          headers: ['Player', 'Games', 'Goals', 'Assists', 'Points', 'Plus/Minus', 'Rating'],
          chartType: 'bar'
        },
        {
          name: 'Team Trends',
          data: [],
          headers: ['Date', 'Goals For', 'Goals Against', 'Shots For', 'Shots Against', 'PP%', 'PK%'],
          chartType: 'line'
        }
      ]
    },
    features: ['Multiple metrics', 'Trend analysis', 'Visual charts', 'Executive summary'],
    tags: ['report', 'performance', 'analytics', 'trends'],
    difficulty: 'advanced',
    estimatedTime: '5-8 minutes',
    fileSize: 'large',
    compatibility: ['Excel', 'CSV', 'Dashboard'],
    version: '2.2',
    author: 'Analytics Pro',
    lastUpdated: new Date('2024-01-19')
  },

  {
    id: 'medical-report',
    name: 'Medical & Injury Report',
    description: 'Comprehensive medical status and injury tracking',
    category: 'reports',
    icon: <Activity className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'custom',
      pageSize: 'A4',
      orientation: 'portrait',
      includeMetadata: true,
      includeNotes: true,
      includeStatistics: true,
      coverPage: true,
      pageNumbers: true,
      watermark: 'MEDICAL CONFIDENTIAL',
      password: 'default',
      permissions: {
        print: false,
        modify: false,
        copy: false,
        annotate: true
      }
    },
    features: ['Injury tracking', 'Return-to-play', 'Medical clearance', 'Confidential'],
    tags: ['medical', 'injury', 'health', 'confidential'],
    difficulty: 'intermediate',
    estimatedTime: '4-6 minutes',
    fileSize: 'medium',
    compatibility: ['PDF', 'Secure'],
    isPremium: true,
    version: '1.0',
    author: 'Medical Staff',
    lastUpdated: new Date('2024-01-08')
  },

  // Specialized Templates
  {
    id: 'video-analysis-package',
    name: 'Video Analysis Package',
    description: 'Combines tactical plays with video analysis and screenshots',
    category: 'game-analysis',
    icon: <Video className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'game-analysis',
      pageSize: 'A4',
      orientation: 'landscape',
      includeMetadata: true,
      includeNotes: true,
      includeVideoScreenshots: true,
      includeAnimationFrames: true,
      includeDiagrams: true,
      includeAnalytics: true,
      coverPage: true,
      tableOfContents: true,
      pageNumbers: true,
      quality: 'ultra'
    },
    features: ['Video integration', 'Screenshots', 'Animation frames', 'High quality'],
    tags: ['video', 'analysis', 'screenshots', 'multimedia'],
    difficulty: 'advanced',
    estimatedTime: '10-15 minutes',
    fileSize: 'large',
    compatibility: ['PDF', 'Digital'],
    isPremium: true,
    version: '1.0',
    author: 'Video Analyst',
    lastUpdated: new Date('2024-01-25')
  },

  {
    id: 'quick-reference-card',
    name: 'Quick Reference Cards',
    description: 'Compact cards for bench reference during games',
    category: 'team-management',
    icon: <Zap className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'custom',
      pageSize: 'A4',
      orientation: 'landscape',
      includeMetadata: false,
      includeNotes: false,
      includeDiagrams: true,
      coverPage: false,
      pageNumbers: false,
      templateCustomization: {
        headerStyle: 'minimal',
        layoutStyle: 'compact',
        diagramSize: 'small',
        fontSizes: {
          title: 12,
          heading: 10,
          body: 8,
          caption: 6
        }
      }
    },
    features: ['Compact layout', 'Essential info', 'Bench-friendly', 'Lamination ready'],
    tags: ['reference', 'bench', 'compact', 'game'],
    isPopular: true,
    difficulty: 'beginner',
    estimatedTime: '1-2 minutes',
    fileSize: 'small',
    compatibility: ['PDF', 'Print', 'Laminate'],
    version: '1.0',
    author: 'Hockey Hub',
    lastUpdated: new Date('2024-01-20')
  }
];

// Template utilities
export const getTemplatesByCategory = (category: TemplateCategory): ExportTemplate[] => {
  return exportTemplates.filter(template => template.category === category);
};

export const getPopularTemplates = (): ExportTemplate[] => {
  return exportTemplates.filter(template => template.isPopular);
};

export const getPremiumTemplates = (): ExportTemplate[] => {
  return exportTemplates.filter(template => template.isPremium);
};

export const getTemplateById = (id: string): ExportTemplate | undefined => {
  return exportTemplates.find(template => template.id === id);
};

export const searchTemplates = (query: string): ExportTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return exportTemplates.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    template.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
  );
};

export const getTemplatesByDifficulty = (difficulty: 'beginner' | 'intermediate' | 'advanced'): ExportTemplate[] => {
  return exportTemplates.filter(template => template.difficulty === difficulty);
};

export const getTemplatesByFormat = (format: 'pdf' | 'excel' | 'csv' | 'png' | 'svg'): ExportTemplate[] => {
  return exportTemplates.filter(template => template.options.format === format);
};

// Template categories with metadata
export const templateCategories: Record<TemplateCategory, {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = {
  practice: {
    name: 'Practice Plans',
    description: 'Templates for organizing and documenting practice sessions',
    icon: <Calendar className="h-4 w-4" />,
    color: 'blue'
  },
  'game-analysis': {
    name: 'Game Analysis',
    description: 'Post-game analysis and performance review templates',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'green'
  },
  'player-development': {
    name: 'Player Development',
    description: 'Individual and team skill development tracking',
    icon: <Target className="h-4 w-4" />,
    color: 'purple'
  },
  'team-management': {
    name: 'Team Management',
    description: 'Strategic planning and team organization tools',
    icon: <Users className="h-4 w-4" />,
    color: 'orange'
  },
  scouting: {
    name: 'Scouting Reports',
    description: 'Opposition analysis and scouting documentation',
    icon: <Eye className="h-4 w-4" />,
    color: 'red'
  },
  presentation: {
    name: 'Presentations',
    description: 'Professional presentations for meetings and clinics',
    icon: <Presentation className="h-4 w-4" />,
    color: 'indigo'
  },
  reports: {
    name: 'Reports',
    description: 'Analytical reports and performance documentation',
    icon: <FileText className="h-4 w-4" />,
    color: 'gray'
  }
};

// Template validation
export const validateTemplate = (template: ExportTemplate): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!template.id || template.id.trim() === '') {
    errors.push('Template ID is required');
  }

  if (!template.name || template.name.trim() === '') {
    errors.push('Template name is required');
  }

  if (!template.description || template.description.trim() === '') {
    errors.push('Template description is required');
  }

  if (!templateCategories[template.category]) {
    errors.push('Invalid template category');
  }

  if (!template.options || Object.keys(template.options).length === 0) {
    errors.push('Template options are required');
  }

  if (!template.features || template.features.length === 0) {
    errors.push('Template must have at least one feature');
  }

  if (!template.tags || template.tags.length === 0) {
    errors.push('Template must have at least one tag');
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(template.difficulty)) {
    errors.push('Invalid difficulty level');
  }

  if (!['small', 'medium', 'large'].includes(template.fileSize)) {
    errors.push('Invalid file size category');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Template creation helper
export const createCustomTemplate = (
  base: Partial<ExportTemplate>,
  customOptions: Partial<ExportOptions>
): ExportTemplate => {
  const defaultTemplate: ExportTemplate = {
    id: `custom-${Date.now()}`,
    name: 'Custom Template',
    description: 'User-created custom template',
    category: 'team-management',
    icon: <Settings className="h-4 w-4" />,
    options: {
      format: 'pdf',
      template: 'custom',
      quality: 'high',
      ...customOptions
    },
    features: ['Custom layout', 'Personalized settings'],
    tags: ['custom', 'user-created'],
    difficulty: 'intermediate',
    estimatedTime: '3-5 minutes',
    fileSize: 'medium',
    compatibility: ['PDF'],
    version: '1.0',
    author: 'User',
    lastUpdated: new Date()
  };

  return {
    ...defaultTemplate,
    ...base,
    options: {
      ...defaultTemplate.options,
      ...base.options,
      ...customOptions
    }
  };
};

export default exportTemplates;