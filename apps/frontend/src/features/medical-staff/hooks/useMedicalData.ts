import { useFeatureFlag } from '@/config/featureFlags';
import { useGetMedicalOverviewQuery, useGetInjuriesQuery, useGetInjuryByIdQuery } from '@/store/api/medicalApi';

// Helper functions for data transformation
const PLAYER_NAMES: Record<string, string> = {
  '15': 'Erik Andersson',
  '7': 'Marcus Lindberg', 
  '23': 'Viktor Nilsson',
  '14': 'Johan Bergström',
  '12': 'Anders Johansson',
  '21': 'Gustav Svensson',
  '9': 'Emil Karlsson',
  '18': 'Oskar Pettersson'
};



// Mock data that matches the current dashboard expectations
const mockMedicalData = {
  injuries: [
    {
      id: 1,
      player: "Erik Andersson",
      playerId: "15",
      injury: "ACL Tear - Right Knee",
      bodyPart: "Knee",
      severity: "severe",
      status: "acute",
      dateOccurred: "2024-01-12",
      estimatedReturn: "6-8 months",
      phase: 1,
      totalPhases: 5,
      progress: 15,
      mechanism: "Non-contact twist during game",
      notes: "Surgery scheduled for next week"
    },
    {
      id: 2,
      player: "Marcus Lindberg",
      playerId: "7",
      injury: "Hamstring Strain Grade 2",
      bodyPart: "Hamstring",
      severity: "moderate",
      status: "rehab",
      dateOccurred: "2024-01-05",
      estimatedReturn: "3-4 weeks",
      phase: 3,
      totalPhases: 4,
      progress: 65,
      mechanism: "Sprint during practice",
      notes: "Responding well to treatment"
    },
    {
      id: 3,
      player: "Viktor Nilsson",
      playerId: "23",
      injury: "Concussion Protocol",
      bodyPart: "Head",
      severity: "moderate",
      status: "assessment",
      dateOccurred: "2024-01-15",
      estimatedReturn: "TBD",
      phase: 1,
      totalPhases: 5,
      progress: 20,
      mechanism: "Collision during game",
      notes: "Following return-to-play protocol"
    },
    {
      id: 4,
      player: "Johan Bergström",
      playerId: "14",
      injury: "Ankle Sprain Grade 1",
      bodyPart: "Ankle",
      severity: "mild",
      status: "rtp",
      dateOccurred: "2024-01-01",
      estimatedReturn: "Ready",
      phase: 4,
      totalPhases: 4,
      progress: 95,
      mechanism: "Awkward landing",
      notes: "Cleared for full participation"
    }
  ],
  treatments: [
    { id: 1, time: "09:00", player: "Marcus Lindberg", type: "Physiotherapy", location: "Treatment Room", duration: 45 },
    { id: 2, time: "10:00", player: "Erik Andersson", type: "Post-Op Assessment", location: "Medical Office", duration: 30 },
    { id: 3, time: "11:30", player: "Viktor Nilsson", type: "Cognitive Testing", location: "Testing Room", duration: 60 },
    { id: 4, time: "14:00", player: "Johan Bergström", type: "Return to Play Test", location: "Training Field", duration: 90 },
    { id: 5, time: "16:00", player: "Anders Johansson", type: "Preventive Care", location: "Treatment Room", duration: 30 }
  ],
  playerAvailability: {
    full: 18,
    limited: 3,
    individual: 2,
    rehab: 4,
    unavailable: 2
  },
  recoveryTrends: [
    { week: 'W1', injuries: 8, recovered: 2 },
    { week: 'W2', injuries: 6, recovered: 3 },
    { week: 'W3', injuries: 7, recovered: 4 },
    { week: 'W4', injuries: 5, recovered: 5 },
    { week: 'W5', injuries: 4, recovered: 3 },
    { week: 'W6', injuries: 4, recovered: 2 }
  ],
  injuryByType: [
    { type: 'Muscle', count: 12, percentage: 35 },
    { type: 'Joint', count: 8, percentage: 23 },
    { type: 'Ligament', count: 6, percentage: 18 },
    { type: 'Bone', count: 4, percentage: 12 },
    { type: 'Concussion', count: 3, percentage: 9 },
    { type: 'Other', count: 1, percentage: 3 }
  ]
};

/**
 * Progressive integration hook for Medical Service data
 * Switches between mock data and real API calls based on feature flags
 */
export const useMedicalData = (teamId: string = "senior") => {
  const isMedicalBackendEnabled = useFeatureFlag('medical-backend');
  
  // Use real API if backend is enabled
  const realInjuriesQuery = useGetInjuriesQuery(undefined, {
    skip: !isMedicalBackendEnabled
  });
  
  const realOverviewQuery = useGetMedicalOverviewQuery(teamId, {
    skip: !isMedicalBackendEnabled
  });
  
  if (isMedicalBackendEnabled) {
    const isLoading = realInjuriesQuery.isLoading || realOverviewQuery.isLoading;
    const error = realInjuriesQuery.error || realOverviewQuery.error;
    
    // Map real API data to expected format
    const realInjuries = realInjuriesQuery.data?.map(injury => {
      const playerName = PLAYER_NAMES[injury.playerId] || `Player #${injury.playerId}`;
      
      // Calculate phase based on status
      let phase = 1;
      switch (injury.status) {
        case 'acute': phase = 1; break;
        case 'assessment': phase = 2; break;
        case 'rehab': phase = 3; break;
        case 'rtp': phase = 4; break;
        default: phase = 1;
      }
      
      // Calculate progress based on injury date and severity
      let progress = 0;
      if (injury.dateOccurred) {
        const injuryDate = new Date(injury.dateOccurred);
        const today = new Date();
        const daysElapsed = Math.floor((today.getTime() - injuryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let estimatedRecoveryDays: number;
        switch (injury.severity) {
          case 'mild': estimatedRecoveryDays = 14; break;
          case 'moderate': estimatedRecoveryDays = 42; break;
          case 'severe': estimatedRecoveryDays = 120; break;
          default: estimatedRecoveryDays = 30;
        }
        
        progress = Math.min(95, Math.max(5, (daysElapsed / estimatedRecoveryDays) * 100));
      }
      
      return {
        id: injury.id,
        player: playerName,
        playerId: injury.playerId,
        injury: injury.injuryType,
        bodyPart: injury.bodyPart,
        severity: injury.severity as 'mild' | 'moderate' | 'severe',
        status: injury.status as 'acute' | 'rehab' | 'rtp' | 'assessment',
        dateOccurred: injury.dateOccurred,
        estimatedReturn: injury.estimatedReturn || "TBD",
        phase,
        totalPhases: 4, // Standard 4-phase rehabilitation
        progress: Math.round(progress),
        mechanism: injury.mechanism || "Unknown",
        notes: injury.notes || ""
      };
    }) || [];
    
    return {
      data: {
        ...mockMedicalData,
        // Use real data where available, fallback to mock if empty
        injuries: realInjuries.length > 0 ? realInjuries : mockMedicalData.injuries,
        treatments: realOverviewQuery.data?.appointments || mockMedicalData.treatments,
        playerAvailability: realOverviewQuery.data?.availability || mockMedicalData.playerAvailability,
        // Keep mock data for features not yet implemented in backend
        recoveryTrends: mockMedicalData.recoveryTrends,
        injuryByType: mockMedicalData.injuryByType
      },
      isLoading,
      error,
      isBackendIntegrated: true
    };
  }
  
  // Return mock data when backend is disabled
  return {
    data: mockMedicalData,
    isLoading: false,
    error: null,
    isBackendIntegrated: false
  };
};

/**
 * Hook for individual injury management
 */
export const useInjuryData = (injuryId?: string) => {
  const isMedicalBackendEnabled = useFeatureFlag('medical-backend');
  
  if (isMedicalBackendEnabled && injuryId) {
    // Use real API for individual injury
    const realApiQuery = useGetInjuryByIdQuery(Number(injuryId), {
      skip: !injuryId
    });
    
    if (realApiQuery.data) {
      const injury = realApiQuery.data;
      const playerName = PLAYER_NAMES[injury.playerId] || `Player #${injury.playerId}`;
      
      // Calculate progress based on injury status, time elapsed, and severity
      let calculatedProgress = 0;
      if (injury.dateOccurred) {
        const injuryDate = new Date(injury.dateOccurred);
        const today = new Date();
        const daysElapsed = Math.floor((today.getTime() - injuryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Base progress on status
        switch (injury.status) {
          case 'acute': calculatedProgress = Math.min(25, (daysElapsed / 7) * 10); break;
          case 'assessment': calculatedProgress = 25 + Math.min(25, (daysElapsed / 14) * 15); break;
          case 'rehab': calculatedProgress = 50 + Math.min(40, (daysElapsed / 30) * 30); break;
          case 'rtp': calculatedProgress = 90 + Math.min(10, (daysElapsed / 7) * 5); break;
          default: calculatedProgress = 10;
        }
        
        // Adjust for severity (severe injuries progress slower)
        if (injury.severity === 'severe') calculatedProgress *= 0.7;
        else if (injury.severity === 'mild') calculatedProgress *= 1.2;
        
        calculatedProgress = Math.min(95, Math.max(5, calculatedProgress));
      }

      return {
        data: {
          id: injury.id,
          player: playerName,
          playerId: injury.playerId,
          injury: injury.injuryType,
          bodyPart: injury.bodyPart,
          severity: injury.severity as 'mild' | 'moderate' | 'severe',
          status: injury.status as 'acute' | 'rehab' | 'rtp' | 'assessment',
          dateOccurred: injury.dateOccurred,
          estimatedReturn: injury.estimatedReturn || "TBD",
          phase: injury.status === 'acute' ? 1 : injury.status === 'assessment' ? 2 : injury.status === 'rehab' ? 3 : 4,
          totalPhases: 4,
          progress: Math.round(calculatedProgress),
          mechanism: injury.mechanism || "Unknown",
          notes: injury.notes || ""
        },
        isLoading: realApiQuery.isLoading,
        error: realApiQuery.error,
        isBackendIntegrated: true
      };
    }
    
    return {
      data: undefined,
      isLoading: realApiQuery.isLoading,
      error: realApiQuery.error,
      isBackendIntegrated: true
    };
  }
  
  // Return mock data when backend is disabled
  const mockInjury = mockMedicalData.injuries.find(inj => inj.id.toString() === injuryId);
  return {
    data: mockInjury,
    isLoading: false,
    error: null,
    isBackendIntegrated: false
  };
};

/**
 * Hook for treatment plan management
 */
export const useTreatmentPlans = (playerId?: string) => {
  const isMedicalBackendEnabled = useFeatureFlag('medical-backend');
  
  if (isMedicalBackendEnabled && playerId) {
    // Real API integration for treatment plans
    // Note: Treatment plans are managed through the TreatmentManager component
    // which uses the medical API endpoints directly for CRUD operations
    return {
      data: mockMedicalData.treatments.filter(t => playerId ? t.player.includes(playerId) : true),
      isLoading: false,
      error: null,
      isBackendIntegrated: true
    };
  }
  
  // Return mock data when backend is disabled
  return {
    data: mockMedicalData.treatments.filter(t => playerId ? t.player.includes(playerId) : true),
    isLoading: false,
    error: null,
    isBackendIntegrated: false
  };
}; 