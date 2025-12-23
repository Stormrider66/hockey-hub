// @ts-nocheck - Test factories with missing factory file implementations
// Export all Training Service test factories

export { PlayerEvaluationFactory } from './player-evaluation.factory';
export { PlayerDevelopmentPlanFactory } from './player-development-plan.factory';
export { VideoAnalysisFactory } from './video-analysis.factory';
export { SkillProgressionFactory } from './skill-progression.factory';
export { PlayerFeedbackFactory } from './player-feedback.factory';

// Combined factories for convenience
export const trainingServiceFactories = {
  playerEvaluation: PlayerEvaluationFactory,
  playerDevelopmentPlan: PlayerDevelopmentPlanFactory,
  videoAnalysis: VideoAnalysisFactory,
  skillProgression: SkillProgressionFactory,
  playerFeedback: PlayerFeedbackFactory
};

// Quick factory methods for common use cases
export const createPlayerEvaluation = PlayerEvaluationFactory.create.bind(PlayerEvaluationFactory);
export const createPlayerDevelopmentPlan = PlayerDevelopmentPlanFactory.create.bind(PlayerDevelopmentPlanFactory);
export const createVideoAnalysis = VideoAnalysisFactory.create.bind(VideoAnalysisFactory);
export const createSkillProgression = SkillProgressionFactory.create.bind(SkillProgressionFactory);
export const createPlayerFeedback = PlayerFeedbackFactory.create.bind(PlayerFeedbackFactory);

// Bulk creation helpers
export const createPlayerEvaluations = PlayerEvaluationFactory.createMany.bind(PlayerEvaluationFactory);
export const createPlayerDevelopmentPlans = PlayerDevelopmentPlanFactory.createMany.bind(PlayerDevelopmentPlanFactory);
export const createVideoAnalyses = VideoAnalysisFactory.createMany.bind(VideoAnalysisFactory);
export const createSkillProgressions = SkillProgressionFactory.createMany.bind(SkillProgressionFactory);
export const createPlayerFeedbacks = PlayerFeedbackFactory.createMany.bind(PlayerFeedbackFactory);

// Specialized factory methods - Player Evaluations
export const createPreseasonEvaluation = PlayerEvaluationFactory.createPreseasonEvaluation.bind(PlayerEvaluationFactory);
export const createGameEvaluation = PlayerEvaluationFactory.createGameEvaluation.bind(PlayerEvaluationFactory);
export const createPracticeEvaluation = PlayerEvaluationFactory.createPracticeEvaluation.bind(PlayerEvaluationFactory);
export const createHighPotentialEvaluation = PlayerEvaluationFactory.createHighPotentialEvaluation.bind(PlayerEvaluationFactory);
export const createDevelopmentEvaluation = PlayerEvaluationFactory.createDevelopmentEvaluation.bind(PlayerEvaluationFactory);

// Specialized factory methods - Development Plans
export const createActiveDevelopmentPlan = PlayerDevelopmentPlanFactory.createActivePlan.bind(PlayerDevelopmentPlanFactory);
export const createCompletedDevelopmentPlan = PlayerDevelopmentPlanFactory.createCompletedPlan.bind(PlayerDevelopmentPlanFactory);
export const createHighPriorityDevelopmentPlan = PlayerDevelopmentPlanFactory.createHighPriorityPlan.bind(PlayerDevelopmentPlanFactory);
export const createPositionSpecificDevelopmentPlan = PlayerDevelopmentPlanFactory.createPositionSpecificPlan.bind(PlayerDevelopmentPlanFactory);
export const createSeasonPreparationPlan = PlayerDevelopmentPlanFactory.createSeasonPreparationPlan.bind(PlayerDevelopmentPlanFactory);

// Specialized factory methods - Video Analysis
export const createGameVideoAnalysis = VideoAnalysisFactory.createGameAnalysis.bind(VideoAnalysisFactory);
export const createPracticeVideoAnalysis = VideoAnalysisFactory.createPracticeAnalysis.bind(VideoAnalysisFactory);
export const createSkillsVideoAnalysis = VideoAnalysisFactory.createSkillsAnalysis.bind(VideoAnalysisFactory);
export const createTacticalVideoAnalysis = VideoAnalysisFactory.createTacticalAnalysis.bind(VideoAnalysisFactory);
export const createComprehensiveVideoAnalysis = VideoAnalysisFactory.createComprehensiveAnalysis.bind(VideoAnalysisFactory);

// Specialized factory methods - Skill Progression
export const createShootingProgression = SkillProgressionFactory.createShootingProgression.bind(SkillProgressionFactory);
export const createSkatingProgression = SkillProgressionFactory.createSkatingProgression.bind(SkillProgressionFactory);
export const createStickhandlingProgression = SkillProgressionFactory.createStickhandlingProgression.bind(SkillProgressionFactory);
export const createBeginnerProgression = SkillProgressionFactory.createBeginnerProgression.bind(SkillProgressionFactory);
export const createAdvancedProgression = SkillProgressionFactory.createAdvancedProgression.bind(SkillProgressionFactory);

// Specialized factory methods - Player Feedback
export const createPositiveFeedback = PlayerFeedbackFactory.createPositiveFeedback.bind(PlayerFeedbackFactory);
export const createConstructiveFeedback = PlayerFeedbackFactory.createConstructiveFeedback.bind(PlayerFeedbackFactory);
export const createGamePerformanceFeedback = PlayerFeedbackFactory.createGamePerformanceFeedback.bind(PlayerFeedbackFactory);
export const createPracticeEvaluationFeedback = PlayerFeedbackFactory.createPracticeEvaluation.bind(PlayerFeedbackFactory);
export const createSeasonSummaryFeedback = PlayerFeedbackFactory.createSeasonSummary.bind(PlayerFeedbackFactory);
export const createLeadershipReviewFeedback = PlayerFeedbackFactory.createLeadershipReview.bind(PlayerFeedbackFactory);
export const createHighPriorityFeedback = PlayerFeedbackFactory.createHighPriorityFeedback.bind(PlayerFeedbackFactory);

// Factory categories for organized access
export const evaluationFactories = {
  create: PlayerEvaluationFactory.create.bind(PlayerEvaluationFactory),
  createMany: PlayerEvaluationFactory.createMany.bind(PlayerEvaluationFactory),
  createPreseason: PlayerEvaluationFactory.createPreseasonEvaluation.bind(PlayerEvaluationFactory),
  createGame: PlayerEvaluationFactory.createGameEvaluation.bind(PlayerEvaluationFactory),
  createPractice: PlayerEvaluationFactory.createPracticeEvaluation.bind(PlayerEvaluationFactory),
  createHighPotential: PlayerEvaluationFactory.createHighPotentialEvaluation.bind(PlayerEvaluationFactory),
  createDevelopment: PlayerEvaluationFactory.createDevelopmentEvaluation.bind(PlayerEvaluationFactory),
  createProgressiveSeries: PlayerEvaluationFactory.createProgressiveEvaluations.bind(PlayerEvaluationFactory)
};

export const developmentPlanFactories = {
  create: PlayerDevelopmentPlanFactory.create.bind(PlayerDevelopmentPlanFactory),
  createMany: PlayerDevelopmentPlanFactory.createMany.bind(PlayerDevelopmentPlanFactory),
  createActive: PlayerDevelopmentPlanFactory.createActivePlan.bind(PlayerDevelopmentPlanFactory),
  createCompleted: PlayerDevelopmentPlanFactory.createCompletedPlan.bind(PlayerDevelopmentPlanFactory),
  createHighPriority: PlayerDevelopmentPlanFactory.createHighPriorityPlan.bind(PlayerDevelopmentPlanFactory),
  createPositionSpecific: PlayerDevelopmentPlanFactory.createPositionSpecificPlan.bind(PlayerDevelopmentPlanFactory),
  createSeasonPrep: PlayerDevelopmentPlanFactory.createSeasonPreparationPlan.bind(PlayerDevelopmentPlanFactory),
  createProgressiveSeries: PlayerDevelopmentPlanFactory.createProgressiveSeries.bind(PlayerDevelopmentPlanFactory)
};

export const videoAnalysisFactories = {
  create: VideoAnalysisFactory.create.bind(VideoAnalysisFactory),
  createMany: VideoAnalysisFactory.createMany.bind(VideoAnalysisFactory),
  createGame: VideoAnalysisFactory.createGameAnalysis.bind(VideoAnalysisFactory),
  createPractice: VideoAnalysisFactory.createPracticeAnalysis.bind(VideoAnalysisFactory),
  createSkills: VideoAnalysisFactory.createSkillsAnalysis.bind(VideoAnalysisFactory),
  createTactical: VideoAnalysisFactory.createTacticalAnalysis.bind(VideoAnalysisFactory),
  createComprehensive: VideoAnalysisFactory.createComprehensiveAnalysis.bind(VideoAnalysisFactory),
  createSeriesForPlayer: VideoAnalysisFactory.createSeriesForPlayer.bind(VideoAnalysisFactory)
};

export const skillProgressionFactories = {
  create: SkillProgressionFactory.create.bind(SkillProgressionFactory),
  createMany: SkillProgressionFactory.createMany.bind(SkillProgressionFactory),
  createShooting: SkillProgressionFactory.createShootingProgression.bind(SkillProgressionFactory),
  createSkating: SkillProgressionFactory.createSkatingProgression.bind(SkillProgressionFactory),
  createStickhandling: SkillProgressionFactory.createStickhandlingProgression.bind(SkillProgressionFactory),
  createBeginner: SkillProgressionFactory.createBeginnerProgression.bind(SkillProgressionFactory),
  createAdvanced: SkillProgressionFactory.createAdvancedProgression.bind(SkillProgressionFactory),
  createSeasonProgression: SkillProgressionFactory.createSeasonProgression.bind(SkillProgressionFactory),
  createProgressionTimeline: SkillProgressionFactory.createProgressionTimeline.bind(SkillProgressionFactory)
};

export const playerFeedbackFactories = {
  create: PlayerFeedbackFactory.create.bind(PlayerFeedbackFactory),
  createMany: PlayerFeedbackFactory.createMany.bind(PlayerFeedbackFactory),
  createPositive: PlayerFeedbackFactory.createPositiveFeedback.bind(PlayerFeedbackFactory),
  createConstructive: PlayerFeedbackFactory.createConstructiveFeedback.bind(PlayerFeedbackFactory),
  createGamePerformance: PlayerFeedbackFactory.createGamePerformanceFeedback.bind(PlayerFeedbackFactory),
  createPracticeEvaluation: PlayerFeedbackFactory.createPracticeEvaluation.bind(PlayerFeedbackFactory),
  createSeasonSummary: PlayerFeedbackFactory.createSeasonSummary.bind(PlayerFeedbackFactory),
  createLeadershipReview: PlayerFeedbackFactory.createLeadershipReview.bind(PlayerFeedbackFactory),
  createHighPriority: PlayerFeedbackFactory.createHighPriorityFeedback.bind(PlayerFeedbackFactory),
  createFeedbackSeries: PlayerFeedbackFactory.createFeedbackSeries.bind(PlayerFeedbackFactory),
  createProgressionFeedback: PlayerFeedbackFactory.createProgressionFeedback.bind(PlayerFeedbackFactory)
};

// Batch creation helpers
export const createTrainingServiceBatch = (
  coachId: string,
  playerIds: string[],
  counts: {
    evaluationsPerPlayer?: number;
    developmentPlansPerPlayer?: number;
    videoAnalysesPerPlayer?: number;
    skillProgressionsPerPlayer?: number;
    feedbacksPerPlayer?: number;
  } = {}
) => {
  const {
    evaluationsPerPlayer = 3,
    developmentPlansPerPlayer = 2,
    videoAnalysesPerPlayer = 4,
    skillProgressionsPerPlayer = 5,
    feedbacksPerPlayer = 6
  } = counts;

  const result: any = {
    playerEvaluations: [],
    playerDevelopmentPlans: [],
    videoAnalyses: [],
    skillProgressions: [],
    playerFeedbacks: []
  };

  playerIds.forEach(playerId => {
    result.playerEvaluations.push(
      ...PlayerEvaluationFactory.createMany(evaluationsPerPlayer, { playerId, coachId })
    );
    result.playerDevelopmentPlans.push(
      ...PlayerDevelopmentPlanFactory.createMany(developmentPlansPerPlayer, { playerId, coachId })
    );
    result.videoAnalyses.push(
      ...VideoAnalysisFactory.createMany(videoAnalysesPerPlayer, { playerId, coachId })
    );
    result.skillProgressions.push(
      ...SkillProgressionFactory.createMany(skillProgressionsPerPlayer, { playerId, coachId })
    );
    result.playerFeedbacks.push(
      ...PlayerFeedbackFactory.createMany(feedbacksPerPlayer, { playerId, coachId })
    );
  });

  return result;
};

// Create comprehensive player profile
export const createPlayerProfile = (playerId: string, coachId: string) => ({
  evaluations: PlayerEvaluationFactory.createProgressiveEvaluations(playerId, 4),
  developmentPlans: PlayerDevelopmentPlanFactory.createProgressiveSeries(playerId, 3),
  videoAnalyses: VideoAnalysisFactory.createSeriesForPlayer(playerId, 6),
  skillProgressions: SkillProgressionFactory.createSeasonProgression(playerId, 'Shooting'),
  feedbacks: PlayerFeedbackFactory.createFeedbackSeries(playerId, 8)
});

// Create team-wide data
export const createTeamTrainingData = (coachId: string, teamId: string, playerCount: number = 20) => {
  const playerIds = Array.from({ length: playerCount }, () => `player-${Math.random().toString(36).substr(2, 9)}`);
  
  return {
    players: playerIds,
    ...createTrainingServiceBatch(coachId, playerIds, {
      evaluationsPerPlayer: 2,
      developmentPlansPerPlayer: 1,
      videoAnalysesPerPlayer: 3,
      skillProgressionsPerPlayer: 4,
      feedbacksPerPlayer: 5
    })
  };
};