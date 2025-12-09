// Utility functions for preloading lazy components

// Medical Analytics preloaders
export const preloadMedicalAnalytics = {
  injuryPattern: () => import('../medical-analytics/InjuryPatternAnalyzer'),
  returnToPlay: () => import('../medical-analytics/ReturnToPlayDashboard'),
  medicalDashboard: () => import('../medical-analytics/MedicalAnalyticsDashboard')
};

// Reporting preloaders
export const preloadReporting = {
  // builder: () => import('../reporting/ReportBuilder'), // Temporarily disabled - missing react-dnd
  templateLibrary: () => import('../reporting/ReportTemplateLibrary'),
  scheduler: () => import('../reporting/ReportScheduler')
};

// Analytics preloaders
export const preloadAnalytics = {
  performanceDashboard: () => import('../analytics/PerformanceAnalyticsDashboard'),
  analyticsDashboard: () => import('../analytics/AnalyticsDashboard'),
  teamPerformance: () => import('../analytics/TeamPerformanceView'),
  individualPerformance: () => import('../analytics/IndividualPerformanceView'),
  workoutEffectiveness: () => import('../analytics/WorkoutEffectivenessMetrics'),
  performanceComparison: () => import('../analytics/PerformanceComparisonTool'),
  loadManagement: () => import('../analytics/LoadManagementPanel'),
  playerAnalytics: () => import('../analytics/PlayerAnalytics'),
  advancedPerformance: () => import('../advanced/PerformanceAnalyticsDashboard')
};

// Predictive Analytics preloaders
export const preloadPredictiveAnalytics = {
  fatigueMonitoring: () => import('../predictive/FatigueMonitoringPanel'),
  injuryRisk: () => import('../predictive/InjuryRiskDashboard'),
  fatigueMonitor: () => import('../predictive/FatigueMonitor'),
  injuryRiskIndicator: () => import('../predictive/InjuryRiskIndicator'),
  loadRecommendation: () => import('../predictive/LoadRecommendationWidget'),
  plateauDetection: () => import('../predictive/PlateauDetectionAlert'),
  predictiveInsights: () => import('../predictive/PredictiveInsightsPanel'),
  recoveryRecommendations: () => import('../predictive/RecoveryRecommendations'),
  riskFactors: () => import('../predictive/RiskFactorsBreakdown')
};

// Preload all medical analytics components
export const preloadAllMedicalAnalytics = () => {
  Object.values(preloadMedicalAnalytics).forEach(loader => loader());
};

// Preload all reporting components
export const preloadAllReporting = () => {
  Object.values(preloadReporting).forEach(loader => loader());
};

// Preload all analytics components
export const preloadAllAnalytics = () => {
  Object.values(preloadAnalytics).forEach(loader => loader());
};

// Preload all predictive analytics components
export const preloadAllPredictiveAnalytics = () => {
  Object.values(preloadPredictiveAnalytics).forEach(loader => loader());
};

// Preload specific component on hover/focus
export const preloadOnInteraction = (
  componentType: 'medical' | 'reporting' | 'analytics' | 'predictive',
  specificComponent?: string
) => {
  if (componentType === 'medical') {
    if (specificComponent && specificComponent in preloadMedicalAnalytics) {
      preloadMedicalAnalytics[specificComponent as keyof typeof preloadMedicalAnalytics]();
    } else {
      preloadAllMedicalAnalytics();
    }
  } else if (componentType === 'reporting') {
    if (specificComponent && specificComponent in preloadReporting) {
      preloadReporting[specificComponent as keyof typeof preloadReporting]();
    } else {
      preloadAllReporting();
    }
  } else if (componentType === 'analytics') {
    if (specificComponent && specificComponent in preloadAnalytics) {
      preloadAnalytics[specificComponent as keyof typeof preloadAnalytics]();
    } else {
      preloadAllAnalytics();
    }
  } else if (componentType === 'predictive') {
    if (specificComponent && specificComponent in preloadPredictiveAnalytics) {
      preloadPredictiveAnalytics[specificComponent as keyof typeof preloadPredictiveAnalytics]();
    } else {
      preloadAllPredictiveAnalytics();
    }
  }
};