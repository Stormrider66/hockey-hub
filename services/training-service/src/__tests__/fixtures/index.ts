// @ts-nocheck - Test fixtures barrel exports
// Export all Training Service test fixtures

export { playerEvaluationFixtures } from './player-evaluation.fixtures';
export { playerDevelopmentPlanFixtures } from './player-development-plan.fixtures';
export { videoAnalysisFixtures } from './video-analysis.fixtures';
export { skillProgressionFixtures } from './skill-progression.fixtures';
export { playerFeedbackFixtures } from './player-feedback.fixtures';

// Combined fixtures for convenience
export const trainingServiceFixtures = {
  playerEvaluations: playerEvaluationFixtures,
  playerDevelopmentPlans: playerDevelopmentPlanFixtures,
  videoAnalyses: videoAnalysisFixtures,
  skillProgressions: skillProgressionFixtures,
  playerFeedback: playerFeedbackFixtures
};

// Fixture categories for easy access
export const validFixtures = {
  playerEvaluations: playerEvaluationFixtures.valid,
  playerDevelopmentPlans: playerDevelopmentPlanFixtures.valid,
  videoAnalyses: videoAnalysisFixtures.valid,
  skillProgressions: skillProgressionFixtures.valid,
  playerFeedback: playerFeedbackFixtures.valid
};

export const invalidFixtures = {
  playerEvaluations: playerEvaluationFixtures.invalid,
  playerDevelopmentPlans: playerDevelopmentPlanFixtures.invalid,
  videoAnalyses: videoAnalysisFixtures.invalid,
  skillProgressions: skillProgressionFixtures.invalid,
  playerFeedback: playerFeedbackFixtures.invalid
};

export const edgeCaseFixtures = {
  playerEvaluations: playerEvaluationFixtures.edgeCase,
  playerDevelopmentPlans: playerDevelopmentPlanFixtures.edgeCase,
  videoAnalyses: videoAnalysisFixtures.edgeCase,
  skillProgressions: skillProgressionFixtures.edgeCase,
  playerFeedback: playerFeedbackFixtures.edgeCase
};

export const bulkFixtures = {
  playerEvaluations: playerEvaluationFixtures.bulk,
  playerDevelopmentPlans: playerDevelopmentPlanFixtures.bulk,
  videoAnalyses: videoAnalysisFixtures.bulk,
  skillProgressions: skillProgressionFixtures.bulk,
  playerFeedback: playerFeedbackFixtures.bulk
};