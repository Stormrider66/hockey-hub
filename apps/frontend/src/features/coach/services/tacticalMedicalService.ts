/**
 * Tactical Medical Service - Hockey Hub
 * 
 * Medical integration for Ice Coach tactical features
 * Ensures player safety in tactical assignments and formations
 */

import { MedicalStatus, InjuryRecord, PlayerMedicalInfo, ExerciseRestriction } from '@/types/medical';

// Medical Status Types for Tactical Planning
export interface TacticalMedicalStatus {
  playerId: string;
  playerName: string;
  overallStatus: 'available' | 'limited' | 'recovering' | 'unavailable';
  medicalClearance: MedicalClearanceLevel;
  positionRestrictions: PositionRestriction[];
  intensityLimitations: IntensityLimitation[];
  contactLimitations: ContactLimitation[];
  returnToPlayPhase?: ReturnToPlayPhase;
  riskFactors: RiskFactor[];
  recommendedLoad: number; // 0-100%
  lastMedicalUpdate: Date;
}

export type MedicalClearanceLevel = 
  | 'full-contact'      // Green: Full participation
  | 'limited-contact'   // Yellow: Modified participation
  | 'non-contact'       // Orange: Skills only, no contact
  | 'no-participation'; // Red: Medical hold

export interface PositionRestriction {
  restrictedPositions: ('forward' | 'defense' | 'goalie')[];
  reason: string;
  severity: 'minor' | 'moderate' | 'severe';
  alternativePositions: string[];
  validUntil?: Date;
}

export interface IntensityLimitation {
  maxIntensity: number; // 0-100%
  restrictedDrills: string[];
  modifications: string[];
  monitoringRequired: boolean;
}

export interface ContactLimitation {
  type: 'no-contact' | 'limited-contact' | 'avoid-body-checks' | 'no-board-battles';
  affectedAreas: string[];
  alternatives: string[];
  duration: number; // days
}

export interface ReturnToPlayPhase {
  currentPhase: 1 | 2 | 3 | 4 | 5; // Standard RTP protocol
  phaseDescription: string;
  tacticalRestrictions: string[];
  nextPhaseDate?: Date;
  clearingPhysician?: string;
}

export interface RiskFactor {
  type: 'concussion' | 'joint' | 'muscle' | 'cardiovascular' | 'fatigue';
  severity: 'low' | 'moderate' | 'high';
  description: string;
  precautions: string[];
}

// Tactical Assignment Validation
export interface TacticalAssignment {
  playerId: string;
  position: string;
  role: string;
  expectedIntensity: number;
  contactLevel: 'high' | 'moderate' | 'low';
  durationMinutes: number;
}

export interface TacticalValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  warnings: MedicalWarning[];
  alternatives: AlternativeAssignment[];
  medicalNotes: string[];
}

export interface MedicalWarning {
  type: 'injury-risk' | 'load-management' | 'position-restriction' | 'contact-limitation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
}

export interface AlternativeAssignment {
  playerId: string;
  playerName: string;
  position: string;
  medicalStatus: MedicalClearanceLevel;
  confidenceScore: number;
  reason: string;
}

// Formation Medical Analysis
export interface FormationMedicalAnalysis {
  formationId: string;
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  playerAnalysis: PlayerFormationAnalysis[];
  recommendations: FormationRecommendation[];
  medicalConcerns: string[];
  alternativeFormations: string[];
}

export interface PlayerFormationAnalysis {
  playerId: string;
  assignedPosition: string;
  medicalCompatibility: number; // 0-100%
  riskFactors: string[];
  recommendations: string[];
}

export interface FormationRecommendation {
  type: 'substitution' | 'position-change' | 'load-reduction' | 'medical-clearance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actionRequired: string;
}

// Medical Dashboard Data
export interface TacticalMedicalDashboard {
  teamOverview: TeamMedicalOverview;
  playerAvailability: PlayerAvailabilityMatrix;
  formationCompatibility: FormationCompatibilityMatrix;
  upcomingMedicalEvents: UpcomingMedicalEvent[];
  riskAlerts: RiskAlert[];
}

export interface TeamMedicalOverview {
  totalPlayers: number;
  fullyAvailable: number;
  limitedAvailability: number;
  recovering: number;
  unavailable: number;
  averageTeamLoad: number;
  medicalTrends: MedicalTrend[];
}

export interface PlayerAvailabilityMatrix {
  [playerId: string]: {
    positions: PositionAvailability;
    intensityCapacity: number;
    contactClearance: boolean;
    estimatedMinutes: number;
  };
}

export interface PositionAvailability {
  forward: 'available' | 'limited' | 'unavailable';
  defense: 'available' | 'limited' | 'unavailable';
  goalie: 'available' | 'limited' | 'unavailable';
}

export interface FormationCompatibilityMatrix {
  [formationName: string]: {
    compatibility: number; // 0-100%
    requiredSubstitutions: number;
    riskLevel: 'low' | 'moderate' | 'high';
    medicalConcerns: string[];
  };
}

export interface UpcomingMedicalEvent {
  playerId: string;
  playerName: string;
  eventType: 'clearance' | 'evaluation' | 'treatment' | 'return-to-play';
  date: Date;
  expectedOutcome: string;
  tacticalImpact: string;
}

export interface RiskAlert {
  id: string;
  playerId: string;
  playerName: string;
  alertType: 'injury-risk' | 'overload' | 'medical-concern' | 'clearance-expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionRequired: string;
  createdAt: Date;
}

export interface MedicalTrend {
  metric: string;
  current: number;
  trend: 'improving' | 'stable' | 'declining';
  changePercent: number;
  timeframe: string;
}

/**
 * Tactical Medical Service Class
 * Main service for medical integration in tactical planning
 */
export class TacticalMedicalService {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:3005') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get medical status for tactical planning
   */
  async getTacticalMedicalStatus(playerIds: string[]): Promise<TacticalMedicalStatus[]> {
    // Always use mock data in development to avoid API dependency
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return this.getMockTacticalMedicalStatus(playerIds);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/medical/tactical/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tactical medical status:', error);
      return this.getMockTacticalMedicalStatus(playerIds);
    }
  }

  /**
   * Validate tactical assignment against medical restrictions
   */
  async validateTacticalAssignment(
    assignment: TacticalAssignment
  ): Promise<TacticalValidationResult> {
    // Always use mock data in development to avoid API dependency
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return this.getMockTacticalValidation(assignment);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/medical/tactical/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating tactical assignment:', error);
      return this.getMockTacticalValidation(assignment);
    }
  }

  /**
   * Analyze formation medical compatibility
   */
  async analyzeFormationMedical(
    formationId: string,
    playerAssignments: TacticalAssignment[]
  ): Promise<FormationMedicalAnalysis> {
    // Always use mock data in development to avoid API dependency
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return this.getMockFormationAnalysis(formationId, playerAssignments);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/medical/tactical/formation-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formationId, playerAssignments }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing formation medical compatibility:', error);
      return this.getMockFormationAnalysis(formationId, playerAssignments);
    }
  }

  /**
   * Get alternative players for injured/limited players
   */
  async getAlternativePlayersForPosition(
    position: string,
    requiredIntensity: number,
    contactLevel: string,
    excludePlayerIds: string[] = []
  ): Promise<AlternativeAssignment[]> {
    // Always use mock data in development to avoid API dependency
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return this.getMockAlternativeAssignments(position);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api/medical/tactical/alternatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          position, 
          requiredIntensity, 
          contactLevel, 
          excludePlayerIds 
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting alternative players:', error);
      return this.getMockAlternativeAssignments(position);
    }
  }

  /**
   * Get medical dashboard data for tactical planning
   */
  async getTacticalMedicalDashboard(teamId?: string): Promise<TacticalMedicalDashboard> {
    // Always use mock data in development to avoid API dependency
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return this.getMockTacticalMedicalDashboard();
    }
    
    try {
      const url = teamId 
        ? `${this.baseUrl}/api/medical/tactical/dashboard?teamId=${teamId}`
        : `${this.baseUrl}/api/medical/tactical/dashboard`;
        
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tactical medical dashboard:', error);
      return this.getMockTacticalMedicalDashboard();
    }
  }

  /**
   * Update player load for medical tracking
   */
  async updatePlayerTacticalLoad(
    playerId: string,
    load: number,
    duration: number,
    intensity: number
  ): Promise<void> {
    // Skip API call in development
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('Mock: Player tactical load updated', { playerId, load, duration, intensity });
      return;
    }
    
    try {
      await fetch(`${this.baseUrl}/api/medical/tactical/load-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId, 
          load, 
          duration, 
          intensity,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error updating player tactical load:', error);
    }
  }

  // Mock Data Methods for Development
  private getMockTacticalMedicalStatus(playerIds: string[]): TacticalMedicalStatus[] {
    return [
      {
        playerId: 'sidney-crosby',
        playerName: 'Sidney Crosby',
        overallStatus: 'recovering',
        medicalClearance: 'non-contact',
        positionRestrictions: [{
          restrictedPositions: [],
          reason: 'Concussion protocol - Phase 3',
          severity: 'moderate',
          alternativePositions: ['Power Play specialist'],
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }],
        intensityLimitations: [{
          maxIntensity: 70,
          restrictedDrills: ['Full contact', 'Board battles', 'Heavy checking'],
          modifications: ['Skills practice only', 'Light skating'],
          monitoringRequired: true
        }],
        contactLimitations: [{
          type: 'no-contact',
          affectedAreas: ['Head', 'Upper body'],
          alternatives: ['Skills coach', 'Video review'],
          duration: 7
        }],
        returnToPlayPhase: {
          currentPhase: 3,
          phaseDescription: 'Non-contact training drills',
          tacticalRestrictions: ['No contact plays', 'Limited ice time'],
          nextPhaseDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          clearingPhysician: 'Dr. Sports Medicine'
        },
        riskFactors: [{
          type: 'concussion',
          severity: 'moderate',
          description: 'Recent concussion, following RTP protocol',
          precautions: ['Monitor symptoms', 'No contact until cleared', 'Gradual progression']
        }],
        recommendedLoad: 60,
        lastMedicalUpdate: new Date()
      },
      {
        playerId: 'nathan-mackinnon',
        playerName: 'Nathan MacKinnon',
        overallStatus: 'limited',
        medicalClearance: 'limited-contact',
        positionRestrictions: [],
        intensityLimitations: [{
          maxIntensity: 85,
          restrictedDrills: ['Heavy defensive zone coverage'],
          modifications: ['Limit shifts to 45 seconds', 'Extra rest between periods'],
          monitoringRequired: true
        }],
        contactLimitations: [{
          type: 'avoid-body-checks',
          affectedAreas: ['Lower leg'],
          alternatives: ['Positional play focus'],
          duration: 14
        }],
        riskFactors: [{
          type: 'joint',
          severity: 'low',
          description: 'Minor knee strain - managing load',
          precautions: ['Ice after practice', 'Monitor swelling', 'Limit high-impact plays']
        }],
        recommendedLoad: 80,
        lastMedicalUpdate: new Date()
      },
      {
        playerId: 'connor-mcdavid',
        playerName: 'Connor McDavid',
        overallStatus: 'available',
        medicalClearance: 'full-contact',
        positionRestrictions: [],
        intensityLimitations: [{
          maxIntensity: 100,
          restrictedDrills: [],
          modifications: [],
          monitoringRequired: false
        }],
        contactLimitations: [],
        riskFactors: [],
        recommendedLoad: 100,
        lastMedicalUpdate: new Date()
      }
    ].filter(player => playerIds.includes(player.playerId));
  }

  private getMockTacticalValidation(assignment: TacticalAssignment): TacticalValidationResult {
    // Simulate validation based on player ID
    if (assignment.playerId === 'sidney-crosby') {
      return {
        isValid: false,
        riskLevel: 'high',
        warnings: [{
          type: 'contact-limitation',
          severity: 'critical',
          message: 'Player is in concussion protocol and cleared for non-contact only',
          recommendation: 'Assign to skills-based role or substitute'
        }],
        alternatives: [{
          playerId: 'connor-mcdavid',
          playerName: 'Connor McDavid',
          position: assignment.position,
          medicalStatus: 'full-contact',
          confidenceScore: 95,
          reason: 'Fully cleared with similar skill set'
        }],
        medicalNotes: ['Concussion protocol phase 3', 'Next evaluation in 3 days']
      };
    }

    if (assignment.playerId === 'nathan-mackinnon') {
      return {
        isValid: true,
        riskLevel: 'moderate',
        warnings: [{
          type: 'load-management',
          severity: 'warning',
          message: 'Player has minor knee strain - monitor ice time',
          recommendation: 'Limit shifts to 45 seconds, provide extra rest'
        }],
        alternatives: [],
        medicalNotes: ['Minor knee strain', 'Cleared for play with modifications']
      };
    }

    return {
      isValid: true,
      riskLevel: 'low',
      warnings: [],
      alternatives: [],
      medicalNotes: ['Player fully cleared for all activities']
    };
  }

  private getMockFormationAnalysis(
    formationId: string, 
    assignments: TacticalAssignment[]
  ): FormationMedicalAnalysis {
    const hasInjuredPlayers = assignments.some(a => 
      ['sidney-crosby', 'nathan-mackinnon'].includes(a.playerId)
    );

    return {
      formationId,
      overallRiskLevel: hasInjuredPlayers ? 'moderate' : 'low',
      playerAnalysis: assignments.map(assignment => ({
        playerId: assignment.playerId,
        assignedPosition: assignment.position,
        medicalCompatibility: assignment.playerId === 'sidney-crosby' ? 40 : 
                              assignment.playerId === 'nathan-mackinnon' ? 75 : 95,
        riskFactors: assignment.playerId === 'sidney-crosby' ? 
          ['Concussion protocol', 'No contact allowed'] :
          assignment.playerId === 'nathan-mackinnon' ? 
          ['Knee strain', 'Load management required'] : [],
        recommendations: assignment.playerId === 'sidney-crosby' ? 
          ['Consider substitution', 'Skills-only participation'] :
          assignment.playerId === 'nathan-mackinnon' ? 
          ['Monitor ice time', 'Extra recovery time'] : []
      })),
      recommendations: hasInjuredPlayers ? [{
        type: 'substitution',
        priority: 'high',
        description: 'Consider alternative players for injured positions',
        actionRequired: 'Review medical clearance status before game time'
      }] : [],
      medicalConcerns: hasInjuredPlayers ? [
        'Concussion protocol compliance required',
        'Load management for knee strain'
      ] : [],
      alternativeFormations: hasInjuredPlayers ? [
        '4-1 Modified Power Play',
        '3-2 Defensive Structure'
      ] : []
    };
  }

  private getMockAlternativeAssignments(position: string): AlternativeAssignment[] {
    return [
      {
        playerId: 'connor-mcdavid',
        playerName: 'Connor McDavid',
        position: position,
        medicalStatus: 'full-contact',
        confidenceScore: 95,
        reason: 'Fully cleared, high skill level'
      },
      {
        playerId: 'auston-matthews',
        playerName: 'Auston Matthews',
        position: position,
        medicalStatus: 'full-contact',
        confidenceScore: 90,
        reason: 'Fully cleared, good positional fit'
      },
      {
        playerId: 'leon-draisaitl',
        playerName: 'Leon Draisaitl',
        position: position,
        medicalStatus: 'limited-contact',
        confidenceScore: 85,
        reason: 'Minor restrictions but capable'
      }
    ];
  }

  private getMockTacticalMedicalDashboard(): TacticalMedicalDashboard {
    return {
      teamOverview: {
        totalPlayers: 23,
        fullyAvailable: 18,
        limitedAvailability: 3,
        recovering: 1,
        unavailable: 1,
        averageTeamLoad: 78,
        medicalTrends: [
          {
            metric: 'Team Availability',
            current: 78,
            trend: 'stable',
            changePercent: 2,
            timeframe: 'Last 7 days'
          },
          {
            metric: 'Injury Rate',
            current: 17,
            trend: 'declining',
            changePercent: -12,
            timeframe: 'Last 30 days'
          }
        ]
      },
      playerAvailability: {
        'sidney-crosby': {
          positions: {
            forward: 'limited',
            defense: 'unavailable',
            goalie: 'unavailable'
          },
          intensityCapacity: 70,
          contactClearance: false,
          estimatedMinutes: 12
        },
        'nathan-mackinnon': {
          positions: {
            forward: 'available',
            defense: 'limited',
            goalie: 'unavailable'
          },
          intensityCapacity: 85,
          contactClearance: true,
          estimatedMinutes: 16
        },
        'connor-mcdavid': {
          positions: {
            forward: 'available',
            defense: 'available',
            goalie: 'unavailable'
          },
          intensityCapacity: 100,
          contactClearance: true,
          estimatedMinutes: 20
        }
      },
      formationCompatibility: {
        'Power Play 1': {
          compatibility: 85,
          requiredSubstitutions: 1,
          riskLevel: 'moderate',
          medicalConcerns: ['Concussion protocol player in high-contact role']
        },
        '5v5 Balanced': {
          compatibility: 75,
          requiredSubstitutions: 2,
          riskLevel: 'moderate',
          medicalConcerns: ['Two players with medical limitations']
        },
        'Defensive Shell': {
          compatibility: 95,
          requiredSubstitutions: 0,
          riskLevel: 'low',
          medicalConcerns: []
        }
      },
      upcomingMedicalEvents: [
        {
          playerId: 'sidney-crosby',
          playerName: 'Sidney Crosby',
          eventType: 'clearance',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          expectedOutcome: 'Possible return to limited contact',
          tacticalImpact: 'Could return to power play duties'
        },
        {
          playerId: 'nathan-mackinnon',
          playerName: 'Nathan MacKinnon',
          eventType: 'evaluation',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          expectedOutcome: 'Full clearance expected',
          tacticalImpact: 'Return to full defensive responsibilities'
        }
      ],
      riskAlerts: [
        {
          id: '1',
          playerId: 'sidney-crosby',
          playerName: 'Sidney Crosby',
          alertType: 'medical-concern',
          severity: 'high',
          message: 'Player in concussion protocol - contact restrictions apply',
          actionRequired: 'Verify non-contact assignments only',
          createdAt: new Date()
        },
        {
          id: '2',
          playerId: 'nathan-mackinnon',
          playerName: 'Nathan MacKinnon',
          alertType: 'overload',
          severity: 'medium',
          message: 'Player approaching recommended load limit',
          actionRequired: 'Monitor ice time and provide extra rest',
          createdAt: new Date()
        }
      ]
    };
  }
}

// Utility Functions
export const getMedicalStatusColor = (status: MedicalClearanceLevel): string => {
  switch (status) {
    case 'full-contact':
      return '#10B981'; // Green
    case 'limited-contact':
      return '#F59E0B'; // Yellow
    case 'non-contact':
      return '#F97316'; // Orange
    case 'no-participation':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

export const getMedicalStatusIcon = (status: MedicalClearanceLevel): string => {
  switch (status) {
    case 'full-contact':
      return '✅';
    case 'limited-contact':
      return '⚠️';
    case 'non-contact':
      return '🔶';
    case 'no-participation':
      return '❌';
    default:
      return '❓';
  }
};

export const formatMedicalRestrictions = (restrictions: PositionRestriction[]): string => {
  if (restrictions.length === 0) return 'No restrictions';
  
  return restrictions.map(r => 
    `${r.restrictedPositions.join(', ')} - ${r.reason}`
  ).join('; ');
};

export const calculateFormationRisk = (analysis: FormationMedicalAnalysis): number => {
  const riskScore = analysis.playerAnalysis.reduce((total, player) => {
    return total + (100 - player.medicalCompatibility);
  }, 0);
  
  return Math.round(riskScore / analysis.playerAnalysis.length);
};

// Export the service instance
export const tacticalMedicalService = new TacticalMedicalService();
export default tacticalMedicalService;