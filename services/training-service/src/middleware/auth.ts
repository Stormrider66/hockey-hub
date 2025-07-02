import { createAuthMiddleware } from '@hockey-hub/shared-lib';

// Create auth middleware instance for training service
export const auth = createAuthMiddleware({
  serviceName: 'training-service'
});

// Export commonly used middleware
export const extractUser = auth.extractUser();
export const requireAuth = auth.requireAuth();
export const requirePermission = (permission: string) => auth.requirePermission(permission);
export const requireAnyPermission = (permissions: string[]) => auth.requireAnyPermission(permissions);
export const requireRole = (role: string) => auth.requireRole(role);
export const requireOrganization = auth.requireOrganization();
export const verifyServiceAuth = auth.verifyServiceAuth();

// Training-specific permission checks
export const canCreateTraining = requirePermission('training.create');
export const canReadTraining = requirePermission('training.read');
export const canUpdateTraining = requirePermission('training.update');
export const canDeleteTraining = requirePermission('training.delete');
export const canExecuteTraining = requirePermission('training.execute');

// Role-based shortcuts
export const requireCoach = requireRole('coach');
export const requirePhysicalTrainer = requireRole('physical_trainer');
export const requirePlayer = requireRole('player');