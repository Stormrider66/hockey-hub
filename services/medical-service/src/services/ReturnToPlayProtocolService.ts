import { Repository } from 'typeorm';
import { 
  ReturnToPlayProtocol, 
  RehabilitationSession, 
  ProtocolStatus, 
  ClearanceLevel, 
  ProtocolPhase 
} from '../entities';

export interface ProtocolTemplate {
  id: string;
  name: string;
  injuryType: string;
  bodyPart: string;
  phases: ProtocolPhaseTemplate[];
  estimatedDurationDays: number;
  description: string;
}

export interface ProtocolPhaseTemplate {
  phase: ProtocolPhase;
  name: string;
  description: string;
  estimatedDays: number;
  requirements: string[];
  exercises: ExerciseTemplate[];
  assessments: AssessmentTemplate[];
  clearanceCriteria: string[];
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  type: 'strength' | 'mobility' | 'cardio' | 'sport_specific' | 'functional';
  description: string;
  sets?: number;
  reps?: string;
  duration?: number;
  intensity: 'low' | 'medium' | 'high';
  modifications: string[];
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  type: 'strength' | 'range_of_motion' | 'functional' | 'sport_specific' | 'psychological';
  description: string;
  passingCriteria: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'phase_completion';
}

export interface ProtocolProgress {
  protocolId: string;
  currentPhase: ProtocolPhase;
  phaseProgress: number; // 0-100
  overallProgress: number; // 0-100
  daysSinceStart: number;
  estimatedDaysRemaining: number;
  isOnTrack: boolean;
  nextMilestone: {
    name: string;
    targetDate: Date;
    requirements: string[];
  };
  recentAssessments: {
    date: Date;
    type: string;
    result: 'pass' | 'fail' | 'partial';
    notes?: string;
  }[];
}

export interface ClearanceDecision {
  playerId: string;
  protocolId: string;
  decision: 'cleared' | 'not_cleared' | 'conditional';
  clearanceLevel: ClearanceLevel;
  restrictions?: string[];
  conditions?: string[];
  nextReviewDate?: Date;
  decidingOfficer: string;
  rationale: string;
  supportingData: {
    assessmentResults: any[];
    physicalMetrics: any[];
    psychologicalReadiness: number;
  };
}

export class ReturnToPlayProtocolService {
  constructor(
    private protocolRepository: Repository<ReturnToPlayProtocol>,
    private sessionRepository: Repository<RehabilitationSession>
  ) {}

  async createProtocol(
    playerId: string,
    injuryId: string,
    templateId: string,
    medicalOfficerId: string,
    supervisingTrainerId?: string
  ): Promise<ReturnToPlayProtocol> {
    const template = await this.getProtocolTemplate(templateId);
    if (!template) {
      throw new Error(`Protocol template ${templateId} not found`);
    }

    const protocol = new ReturnToPlayProtocol();
    protocol.playerId = playerId;
    protocol.injuryId = injuryId;
    protocol.medicalOfficerId = medicalOfficerId;
    protocol.supervisingTrainerId = supervisingTrainerId;
    protocol.startDate = new Date();
    protocol.status = ProtocolStatus.INITIATED;
    protocol.currentPhase = ProtocolPhase.REST;
    protocol.clearanceLevel = ClearanceLevel.NO_CONTACT;

    // Calculate expected completion date based on template
    const expectedCompletion = new Date();
    expectedCompletion.setDate(expectedCompletion.getDate() + template.estimatedDurationDays);
    protocol.expectedCompletionDate = expectedCompletion;

    // Initialize progression milestones from template
    protocol.progressionMilestones = template.phases.map(phase => ({
      phaseId: phase.phase,
      phaseName: phase.name,
      assessmentScore: undefined,
      notes: undefined,
      clearingOfficer: undefined
    }));

    // Calculate total sessions required
    protocol.totalSessionsRequired = template.phases.reduce(
      (total, phase) => total + Math.ceil(phase.estimatedDays / 2), 0
    );

    return await this.protocolRepository.save(protocol);
  }

  async advancePhase(
    protocolId: string,
    newPhase: ProtocolPhase,
    assessmentResults: any[],
    clearingOfficer: string,
    notes?: string
  ): Promise<ReturnToPlayProtocol> {
    const protocol = await this.protocolRepository.findOne({
      where: { id: protocolId },
      relations: ['rehabilitationSessions']
    });

    if (!protocol) {
      throw new Error(`Protocol ${protocolId} not found`);
    }

    // Validate phase progression
    if (!this.isValidPhaseProgression(protocol.currentPhase, newPhase)) {
      throw new Error(`Invalid phase progression from ${protocol.currentPhase} to ${newPhase}`);
    }

    // Update protocol
    const previousPhase = protocol.currentPhase;
    protocol.currentPhase = newPhase;
    protocol.status = ProtocolStatus.IN_PROGRESS;

    // Update clearance level based on phase
    protocol.clearanceLevel = this.getClearanceLevelForPhase(newPhase);

    // Record milestone completion
    if (protocol.progressionMilestones) {
      const milestoneIndex = protocol.progressionMilestones.findIndex(
        m => m.phaseId === previousPhase
      );
      if (milestoneIndex >= 0) {
        protocol.progressionMilestones[milestoneIndex] = {
          ...protocol.progressionMilestones[milestoneIndex],
          completedDate: new Date().toISOString(),
          assessmentScore: this.calculateAssessmentScore(assessmentResults),
          notes,
          clearingOfficer
        };
      }
    }

    // Update sessions completed count
    protocol.sessionsCompleted = protocol.rehabilitationSessions?.length || 0;

    return await this.protocolRepository.save(protocol);
  }

  async recordRehabilitationSession(
    protocolId: string,
    sessionData: {
      sessionDate: Date;
      sessionType: string;
      durationMinutes: number;
      supervisingStaffId: string;
      exercisesCompleted: any[];
      sessionRating?: number;
      painLevelPre?: number;
      painLevelPost?: number;
      notes?: string;
      objectiveMeasurements?: any[];
      isMilestoneSession?: boolean;
      milestoneAssessmentResults?: any[];
    }
  ): Promise<RehabilitationSession> {
    const protocol = await this.protocolRepository.findOne({
      where: { id: protocolId }
    });

    if (!protocol) {
      throw new Error(`Protocol ${protocolId} not found`);
    }

    const session = new RehabilitationSession();
    session.protocolId = protocolId;
    session.sessionDate = sessionData.sessionDate;
    session.sessionType = sessionData.sessionType;
    session.durationMinutes = sessionData.durationMinutes;
    session.supervisingStaffId = sessionData.supervisingStaffId;
    session.exercisesCompleted = sessionData.exercisesCompleted;
    session.sessionRating = sessionData.sessionRating;
    session.painLevelPre = sessionData.painLevelPre;
    session.painLevelPost = sessionData.painLevelPost;
    session.notes = sessionData.notes;
    session.objectiveMeasurements = sessionData.objectiveMeasurements;
    session.isMilestoneSession = sessionData.isMilestoneSession || false;
    session.milestoneAssessmentResults = sessionData.milestoneAssessmentResults;

    // Calculate adherence score
    session.adherenceScore = this.calculateAdherenceScore(sessionData);

    const savedSession = await this.sessionRepository.save(session);

    // Update protocol compliance score
    await this.updateProtocolComplianceScore(protocolId);

    return savedSession;
  }

  async getProtocolProgress(protocolId: string): Promise<ProtocolProgress> {
    const protocol = await this.protocolRepository.findOne({
      where: { id: protocolId },
      relations: ['rehabilitationSessions']
    });

    if (!protocol) {
      throw new Error(`Protocol ${protocolId} not found`);
    }

    const daysSinceStart = Math.floor(
      (new Date().getTime() - new Date(protocol.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const estimatedDaysRemaining = protocol.expectedCompletionDate
      ? Math.max(0, Math.floor(
          (new Date(protocol.expectedCompletionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        ))
      : 0;

    const phaseProgress = this.calculatePhaseProgress(protocol);
    const overallProgress = protocol.completionPercentage;

    // Determine if on track
    const expectedProgressByNow = protocol.expectedCompletionDate
      ? (daysSinceStart / (daysSinceStart + estimatedDaysRemaining)) * 100
      : 50;
    const isOnTrack = overallProgress >= (expectedProgressByNow - 10); // 10% tolerance

    return {
      protocolId,
      currentPhase: protocol.currentPhase,
      phaseProgress,
      overallProgress,
      daysSinceStart,
      estimatedDaysRemaining,
      isOnTrack,
      nextMilestone: this.getNextMilestone(protocol),
      recentAssessments: this.getRecentAssessments(protocol.rehabilitationSessions || [])
    };
  }

  async makeClearanceDecision(
    playerId: string,
    protocolId: string,
    decidingOfficer: string,
    decision: 'cleared' | 'not_cleared' | 'conditional',
    clearanceLevel: ClearanceLevel,
    rationale: string,
    restrictions?: string[],
    conditions?: string[]
  ): Promise<ClearanceDecision> {
    const protocol = await this.protocolRepository.findOne({
      where: { id: protocolId },
      relations: ['rehabilitationSessions']
    });

    if (!protocol) {
      throw new Error(`Protocol ${protocolId} not found`);
    }

    // Update protocol status based on decision
    if (decision === 'cleared') {
      protocol.status = ProtocolStatus.COMPLETED;
      protocol.actualCompletionDate = new Date();
      protocol.clearanceLevel = clearanceLevel;
    } else if (decision === 'not_cleared') {
      // Protocol continues
      protocol.status = ProtocolStatus.IN_PROGRESS;
    }

    await this.protocolRepository.save(protocol);

    // Create clearance decision record
    const clearanceDecision: ClearanceDecision = {
      playerId,
      protocolId,
      decision,
      clearanceLevel,
      restrictions,
      conditions,
      decidingOfficer,
      rationale,
      supportingData: {
        assessmentResults: this.getAssessmentResults(protocol.rehabilitationSessions || []),
        physicalMetrics: this.getPhysicalMetrics(protocol.rehabilitationSessions || []),
        psychologicalReadiness: this.getPsychologicalReadiness(protocol)
      }
    };

    if (decision === 'conditional' || decision === 'not_cleared') {
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 7); // Review in 1 week
      clearanceDecision.nextReviewDate = nextReview;
    }

    return clearanceDecision;
  }

  async getProtocolTemplates(): Promise<ProtocolTemplate[]> {
    // In a real implementation, these would be stored in the database
    return [
      {
        id: 'ankle-sprain',
        name: 'Ankle Sprain Return-to-Play',
        injuryType: 'Ankle Sprain',
        bodyPart: 'ankle',
        estimatedDurationDays: 21,
        description: 'Comprehensive ankle sprain rehabilitation protocol',
        phases: [
          {
            phase: ProtocolPhase.REST,
            name: 'Acute Rest Phase',
            description: 'Initial rest and protection phase',
            estimatedDays: 3,
            requirements: ['Pain level < 4', 'No swelling'],
            exercises: [
              {
                id: 'rice',
                name: 'RICE Protocol',
                type: 'mobility',
                description: 'Rest, Ice, Compression, Elevation',
                intensity: 'low',
                modifications: ['Apply ice 15-20 minutes every 2-3 hours']
              }
            ],
            assessments: [
              {
                id: 'pain-assessment',
                name: 'Pain Level Assessment',
                type: 'functional',
                description: 'Daily pain level monitoring',
                passingCriteria: 'Pain level ≤ 3/10',
                frequency: 'daily'
              }
            ],
            clearanceCriteria: ['Pain-free weight bearing', 'Minimal swelling']
          },
          {
            phase: ProtocolPhase.LIGHT_ACTIVITY,
            name: 'Early Mobilization',
            description: 'Begin gentle range of motion exercises',
            estimatedDays: 5,
            requirements: ['Pain-free weight bearing', 'Basic ankle mobility'],
            exercises: [
              {
                id: 'ankle-circles',
                name: 'Ankle Circles',
                type: 'mobility',
                description: 'Gentle circular movements',
                sets: 3,
                reps: '10 each direction',
                intensity: 'low',
                modifications: ['Perform slowly', 'Stop if pain increases']
              }
            ],
            assessments: [
              {
                id: 'rom-assessment',
                name: 'Range of Motion',
                type: 'range_of_motion',
                description: 'Ankle dorsiflexion and plantarflexion',
                passingCriteria: '80% of uninjured side',
                frequency: 'weekly'
              }
            ],
            clearanceCriteria: ['Full pain-free range of motion', 'Normal gait pattern']
          }
          // Additional phases would be defined here
        ]
      },
      {
        id: 'concussion',
        name: 'Concussion Return-to-Play',
        injuryType: 'Concussion',
        bodyPart: 'head',
        estimatedDurationDays: 14,
        description: 'Progressive concussion return-to-play protocol',
        phases: [
          {
            phase: ProtocolPhase.REST,
            name: 'Complete Rest',
            description: 'Complete physical and cognitive rest',
            estimatedDays: 2,
            requirements: ['Symptom-free for 24 hours'],
            exercises: [],
            assessments: [
              {
                id: 'symptom-checklist',
                name: 'Concussion Symptom Checklist',
                type: 'functional',
                description: 'Daily symptom monitoring',
                passingCriteria: 'No symptoms for 24 hours',
                frequency: 'daily'
              }
            ],
            clearanceCriteria: ['Symptom-free for 24 hours', 'Normal cognitive function']
          }
          // Additional phases would be defined here
        ]
      }
    ];
  }

  // Private helper methods
  private async getProtocolTemplate(templateId: string): Promise<ProtocolTemplate | null> {
    const templates = await this.getProtocolTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  private isValidPhaseProgression(currentPhase: ProtocolPhase, newPhase: ProtocolPhase): boolean {
    const phaseOrder = [
      ProtocolPhase.REST,
      ProtocolPhase.LIGHT_ACTIVITY,
      ProtocolPhase.SPORT_SPECIFIC,
      ProtocolPhase.NON_CONTACT_TRAINING,
      ProtocolPhase.FULL_CONTACT_PRACTICE,
      ProtocolPhase.GAME_CLEARANCE
    ];

    const currentIndex = phaseOrder.indexOf(currentPhase);
    const newIndex = phaseOrder.indexOf(newPhase);

    return newIndex === currentIndex + 1;
  }

  private getClearanceLevelForPhase(phase: ProtocolPhase): ClearanceLevel {
    switch (phase) {
      case ProtocolPhase.REST:
      case ProtocolPhase.LIGHT_ACTIVITY:
        return ClearanceLevel.NO_CONTACT;
      case ProtocolPhase.SPORT_SPECIFIC:
      case ProtocolPhase.NON_CONTACT_TRAINING:
        return ClearanceLevel.LIMITED_CONTACT;
      case ProtocolPhase.FULL_CONTACT_PRACTICE:
        return ClearanceLevel.FULL_CONTACT;
      case ProtocolPhase.GAME_CLEARANCE:
        return ClearanceLevel.GAME_READY;
      default:
        return ClearanceLevel.NO_CONTACT;
    }
  }

  private calculateAssessmentScore(assessmentResults: any[]): number {
    if (assessmentResults.length === 0) return 0;
    
    const totalScore = assessmentResults.reduce((sum, result) => {
      return sum + (result.result === 'pass' ? 100 : result.result === 'partial' ? 50 : 0);
    }, 0);
    
    return Math.round(totalScore / assessmentResults.length);
  }

  private calculateAdherenceScore(sessionData: any): number {
    let score = 70; // Base score
    
    // Bonus for completing all prescribed exercises
    if (sessionData.exercisesCompleted?.length >= 3) score += 15;
    
    // Bonus for good session rating
    if (sessionData.sessionRating && sessionData.sessionRating >= 7) score += 10;
    
    // Bonus for pain improvement
    if (sessionData.painLevelPre && sessionData.painLevelPost && 
        sessionData.painLevelPost < sessionData.painLevelPre) score += 5;
    
    return Math.min(100, score);
  }

  private async updateProtocolComplianceScore(protocolId: string): Promise<void> {
    const protocol = await this.protocolRepository.findOne({
      where: { id: protocolId },
      relations: ['rehabilitationSessions']
    });

    if (!protocol || !protocol.rehabilitationSessions) return;

    const sessions = protocol.rehabilitationSessions;
    const totalAdherence = sessions.reduce((sum, session) => 
      sum + (session.adherenceScore || 0), 0);
    
    const averageCompliance = sessions.length > 0 ? totalAdherence / sessions.length : 0;
    
    protocol.complianceScore = averageCompliance;
    await this.protocolRepository.save(protocol);
  }

  private calculatePhaseProgress(protocol: ReturnToPlayProtocol): number {
    // Simplified calculation - would be more sophisticated in practice
    const sessionsInCurrentPhase = protocol.rehabilitationSessions?.filter(session => {
      const sessionDate = new Date(session.sessionDate);
      const phaseStart = this.estimatePhaseStartDate(protocol);
      return sessionDate >= phaseStart;
    }).length || 0;

    const estimatedSessionsPerPhase = 5; // Simplified
    return Math.min(100, (sessionsInCurrentPhase / estimatedSessionsPerPhase) * 100);
  }

  private estimatePhaseStartDate(protocol: ReturnToPlayProtocol): Date {
    // Simplified - would calculate based on actual phase progression history
    const startDate = new Date(protocol.startDate);
    const phaseOrder = [
      ProtocolPhase.REST,
      ProtocolPhase.LIGHT_ACTIVITY,
      ProtocolPhase.SPORT_SPECIFIC,
      ProtocolPhase.NON_CONTACT_TRAINING,
      ProtocolPhase.FULL_CONTACT_PRACTICE,
      ProtocolPhase.GAME_CLEARANCE
    ];
    
    const currentPhaseIndex = phaseOrder.indexOf(protocol.currentPhase);
    const estimatedDaysPerPhase = 3;
    
    startDate.setDate(startDate.getDate() + (currentPhaseIndex * estimatedDaysPerPhase));
    return startDate;
  }

  private getNextMilestone(protocol: ReturnToPlayProtocol) {
    const phaseOrder = [
      ProtocolPhase.REST,
      ProtocolPhase.LIGHT_ACTIVITY,
      ProtocolPhase.SPORT_SPECIFIC,
      ProtocolPhase.NON_CONTACT_TRAINING,
      ProtocolPhase.FULL_CONTACT_PRACTICE,
      ProtocolPhase.GAME_CLEARANCE
    ];

    const currentIndex = phaseOrder.indexOf(protocol.currentPhase);
    const nextPhase = phaseOrder[Math.min(currentIndex + 1, phaseOrder.length - 1)];

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5); // Estimate 5 days to next phase

    return {
      name: `Advance to ${nextPhase.replace('_', ' ')}`,
      targetDate,
      requirements: ['Complete current phase assessments', 'Meet clearance criteria']
    };
  }

  private getRecentAssessments(sessions: RehabilitationSession[]) {
    return sessions
      .filter(s => s.isMilestoneSession && s.milestoneAssessmentResults)
      .slice(-5) // Last 5 assessments
      .map(s => ({
        date: new Date(s.sessionDate),
        type: s.sessionType,
        result: s.milestoneAssessmentResults?.[0]?.result || 'partial',
        notes: s.notes
      }));
  }

  private getAssessmentResults(sessions: RehabilitationSession[]) {
    return sessions
      .filter(s => s.milestoneAssessmentResults)
      .flatMap(s => s.milestoneAssessmentResults || []);
  }

  private getPhysicalMetrics(sessions: RehabilitationSession[]) {
    return sessions
      .filter(s => s.objectiveMeasurements)
      .flatMap(s => s.objectiveMeasurements || []);
  }

  private getPsychologicalReadiness(protocol: ReturnToPlayProtocol): number {
    // Simplified calculation - would be based on psychological assessments
    const complianceScore = protocol.complianceScore || 0;
    const progressScore = protocol.completionPercentage;
    
    return Math.round((complianceScore + progressScore) / 2);
  }
}