// Test file to verify all imports work correctly
import { BulkSessionWizard } from './BulkSessionWizard';
import { BasicConfigStep, SessionSetupStep, ReviewStep } from './wizard';
import type { 
  BulkSessionConfig, 
  SessionConfiguration, 
  EquipmentAvailability, 
  FacilityInfo 
} from './BulkSessionWizard';

// Test that all exports are available
export const testComponents = {
  BulkSessionWizard,
  BasicConfigStep,
  SessionSetupStep,
  ReviewStep
};

// Test that all types are available
export type TestTypes = {
  config: BulkSessionConfig;
  session: SessionConfiguration;
  equipment: EquipmentAvailability;
  facility: FacilityInfo;
};

console.log('All imports successful!');