// Export all Planning Service test factories

export { TacticalPlanFactory } from './tactical-plan.factory';
export { PracticePlanFactory } from './practice-plan.factory';
export { GameStrategyFactory } from './game-strategy.factory';
export { DrillLibraryFactory } from './drill-library.factory';

// Combined factories for convenience
export const planningServiceFactories = {
  tacticalPlan: TacticalPlanFactory,
  practicePlan: PracticePlanFactory,
  gameStrategy: GameStrategyFactory,
  drillLibrary: DrillLibraryFactory
};

// Quick factory methods for common use cases
export const createTacticalPlan = TacticalPlanFactory.create.bind(TacticalPlanFactory);
export const createPracticePlan = PracticePlanFactory.create.bind(PracticePlanFactory);
export const createGameStrategy = GameStrategyFactory.create.bind(GameStrategyFactory);
export const createDrillLibraryEntry = DrillLibraryFactory.create.bind(DrillLibraryFactory);

// Bulk creation helpers
export const createTacticalPlans = TacticalPlanFactory.createMany.bind(TacticalPlanFactory);
export const createPracticePlans = PracticePlanFactory.createMany.bind(PracticePlanFactory);
export const createGameStrategies = GameStrategyFactory.createMany.bind(GameStrategyFactory);
export const createDrillLibraryEntries = DrillLibraryFactory.createMany.bind(DrillLibraryFactory);

// Specialized factory methods
export const createPowerPlayPlan = TacticalPlanFactory.createPowerPlay.bind(TacticalPlanFactory);
export const createPenaltyKillPlan = TacticalPlanFactory.createPenaltyKill.bind(TacticalPlanFactory);
export const createSkillsPractice = PracticePlanFactory.createSkillsPractice.bind(PracticePlanFactory);
export const createGamePrepPractice = PracticePlanFactory.createGamePrepPractice.bind(PracticePlanFactory);
export const createPreGameStrategy = GameStrategyFactory.createPreGameStrategy.bind(GameStrategyFactory);
export const createSkillsDrill = DrillLibraryFactory.createSkillsDrill.bind(DrillLibraryFactory);
export const createTacticalDrill = DrillLibraryFactory.createTacticalDrill.bind(DrillLibraryFactory);

// Factory categories for organized access
export const tacticalFactories = {
  create: TacticalPlanFactory.create.bind(TacticalPlanFactory),
  createMany: TacticalPlanFactory.createMany.bind(TacticalPlanFactory),
  createPowerPlay: TacticalPlanFactory.createPowerPlay.bind(TacticalPlanFactory),
  createPenaltyKill: TacticalPlanFactory.createPenaltyKill.bind(TacticalPlanFactory),
  createForCategory: TacticalPlanFactory.createForCategory.bind(TacticalPlanFactory)
};

export const practiceFactories = {
  create: PracticePlanFactory.create.bind(PracticePlanFactory),
  createMany: PracticePlanFactory.createMany.bind(PracticePlanFactory),
  createSkillsPractice: PracticePlanFactory.createSkillsPractice.bind(PracticePlanFactory),
  createGamePrepPractice: PracticePlanFactory.createGamePrepPractice.bind(PracticePlanFactory),
  createCompletedPractice: PracticePlanFactory.createCompletedPractice.bind(PracticePlanFactory),
  createWeeklyPractices: PracticePlanFactory.createWeeklyPractices.bind(PracticePlanFactory)
};

export const gameStrategyFactories = {
  create: GameStrategyFactory.create.bind(GameStrategyFactory),
  createMany: GameStrategyFactory.createMany.bind(GameStrategyFactory),
  createPreGameStrategy: GameStrategyFactory.createPreGameStrategy.bind(GameStrategyFactory),
  createCompletedGame: GameStrategyFactory.createCompletedGame.bind(GameStrategyFactory),
  createPlayoffGame: GameStrategyFactory.createPlayoffGame.bind(GameStrategyFactory),
  createSeasonSeries: GameStrategyFactory.createSeasonSeries.bind(GameStrategyFactory)
};

export const drillLibraryFactories = {
  create: DrillLibraryFactory.create.bind(DrillLibraryFactory),
  createMany: DrillLibraryFactory.createMany.bind(DrillLibraryFactory),
  createSkillsDrill: DrillLibraryFactory.createSkillsDrill.bind(DrillLibraryFactory),
  createTacticalDrill: DrillLibraryFactory.createTacticalDrill.bind(DrillLibraryFactory),
  createConditioningDrill: DrillLibraryFactory.createConditioningDrill.bind(DrillLibraryFactory),
  createDrillProgression: DrillLibraryFactory.createDrillProgression.bind(DrillLibraryFactory)
};

// Batch creation helpers
export const createPlanningServiceBatch = (
  coachId: string,
  teamId: string,
  counts: {
    tacticalPlans?: number;
    practicePlans?: number;
    gameStrategies?: number;
    drillLibrary?: number;
  } = {}
) => {
  const {
    tacticalPlans = 5,
    practicePlans = 5,
    gameStrategies = 5,
    drillLibrary = 10
  } = counts;

  return {
    tacticalPlans: TacticalPlanFactory.createMany(tacticalPlans, { coachId, teamId }),
    practicePlans: PracticePlanFactory.createMany(practicePlans, { coachId, teamId }),
    gameStrategies: GameStrategyFactory.createMany(gameStrategies, { coachId, teamId }),
    drillLibrary: DrillLibraryFactory.createMany(drillLibrary, { createdBy: coachId })
  };
};