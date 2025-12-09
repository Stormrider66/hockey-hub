// Export all Planning Service test fixtures

export { tacticalPlanFixtures } from './tactical-plan.fixtures';
export { practicePlanFixtures } from './practice-plan.fixtures';
export { gameStrategyFixtures } from './game-strategy.fixtures';
export { drillLibraryFixtures } from './drill-library.fixtures';

// Combined fixtures for convenience
export const planningServiceFixtures = {
  tacticalPlans: tacticalPlanFixtures,
  practicePlans: practicePlanFixtures,
  gameStrategies: gameStrategyFixtures,
  drillLibrary: drillLibraryFixtures
};

// Fixture categories for easy access
export const validFixtures = {
  tacticalPlans: tacticalPlanFixtures.valid,
  practicePlans: practicePlanFixtures.valid,
  gameStrategies: gameStrategyFixtures.valid,
  drillLibrary: drillLibraryFixtures.valid
};

export const invalidFixtures = {
  tacticalPlans: tacticalPlanFixtures.invalid,
  practicePlans: practicePlanFixtures.invalid,
  gameStrategies: gameStrategyFixtures.invalid,
  drillLibrary: drillLibraryFixtures.invalid
};

export const edgeCaseFixtures = {
  tacticalPlans: tacticalPlanFixtures.edgeCase,
  practicePlans: practicePlanFixtures.edgeCase,
  gameStrategies: gameStrategyFixtures.edgeCase,
  drillLibrary: drillLibraryFixtures.edgeCase
};

export const bulkFixtures = {
  tacticalPlans: tacticalPlanFixtures.bulk,
  practicePlans: practicePlanFixtures.bulk,
  gameStrategies: gameStrategyFixtures.bulk,
  drillLibrary: drillLibraryFixtures.bulk
};