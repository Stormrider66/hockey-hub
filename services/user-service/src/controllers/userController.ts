import { Request, Response, NextFunction } from 'express';
import { ValidationService, validateRequest } from '@hockey-hub/shared-lib/validation/ValidationService';
import { BusinessRules } from '@hockey-hub/shared-lib/validation/rules/BusinessRules';
import { CreateUserValidation } from '@hockey-hub/shared-lib/validation/schemas/user.validation';
import { UpdateUserValidation } from '@hockey-hub/shared-lib/validation/schemas/user.validation';
import { GetUsersQueryValidation } from '@hockey-hub/shared-lib/validation/schemas/user.validation';
type SuccessResponseDTO = { success: true; data?: any; message?: string };
type ErrorResponseDTO = { success: false; error: { code: string; message: string; details?: any }; timestamp?: string };
import { CachedUserService } from '../services/cachedUserService';
import { AppDataSource } from '../config/database';

export class UserController {
  private userService: CachedUserService;

  constructor() {
    this.userService = new CachedUserService();
  }

  // Create user with validation
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validation = await ValidationService.validateWithBusinessRules(
        CreateUserValidation,
        req.body,
        [
          // Business rule: Check organization limits
          () => BusinessRules.validateOrganizationLimits(
            req.body.organizationId,
            'premium', // Would get from organization
            { teams: 5, users: 100, storage: 10 }
          ),
          // Business rule: Validate user age for role
          () => req.body.dateOfBirth 
            ? BusinessRules.validateUserAge(new Date(req.body.dateOfBirth), req.body.role)
            : { isValid: true, errors: [] }
        ]
      );

      if (!validation.isValid) {
        const errorResponse: ErrorResponseDTO = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: {
              fieldErrors: validation.errors,
              businessRuleErrors: validation.businessRuleErrors,
            },
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorResponse);
      }

      // Create user
      const user = await this.userService.createUser(
        req.body,
        req.body.organizationId,
        req.body.role
      );

      const response: SuccessResponseDTO = {
        success: true,
        data: user,
        message: 'User created successfully',
      };

      return res.status(201).json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Update user with validation
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Validate request body
      const validation = await ValidationService.validate(
        UpdateUserValidation,
        req.body
      );

      if (!validation.isValid) {
        const errorResponse: ErrorResponseDTO = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validation.errors,
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorResponse);
      }

      // Update user
      const user = await this.userService.updateUser(userId, req.body);

      const response: SuccessResponseDTO = {
        success: true,
        data: user,
        message: 'User updated successfully',
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Get users with query validation
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query parameters
      const validation = await ValidationService.validate(
        GetUsersQueryValidation,
        req.query
      );

      if (!validation.isValid) {
        const errorResponse: ErrorResponseDTO = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.errors,
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorResponse);
      }

      // Get users
      const result = await this.userService.getUsers(req.query);

      const response: SuccessResponseDTO = {
        success: true,
        data: result,
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  // Validate jersey number
  async validateJerseyNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { teamId, jerseyNumber } = req.body;

      // Get existing jersey numbers for team
      const existingNumbers = await this.getTeamJerseyNumbers(teamId);

      // Validate
      const validation = BusinessRules.validateJerseyNumber(
        jerseyNumber,
        teamId,
        existingNumbers
      );

      if (!validation.isValid) {
        const errorResponse: ErrorResponseDTO = {
          success: false,
          error: {
            code: 'JERSEY_NUMBER_INVALID',
            message: validation.errors[0],
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(400).json(errorResponse);
      }

      const response: SuccessResponseDTO = {
        success: true,
        data: { available: true },
        message: 'Jersey number is available',
      };

      return res.json(response);
    } catch (error) {
      return next(error);
    }
  }

  private async getTeamJerseyNumbers(teamId: string): Promise<number[]> {
    const result = await AppDataSource
      .createQueryBuilder('team_members', 'tm')
      .select('tm.jerseyNumber')
      .where('tm.teamId = :teamId', { teamId })
      .andWhere('tm.isActive = true')
      .andWhere('tm.jerseyNumber IS NOT NULL')
      .getRawMany();

    return result.map((r: any) => r.jerseyNumber);
  }
}

// Router setup with validation middleware
import { Router, type Router as ExpressRouter } from 'express';

export function createUserRouter(): Router {
  const router: ExpressRouter = Router();
  const controller = new UserController();

  // Routes with validation middleware
  router.post(
    '/users',
    validateRequest(CreateUserValidation, 'body'),
    controller.createUser.bind(controller)
  );

  router.patch(
    '/users/:userId',
    validateRequest(UpdateUserValidation, 'body'),
    controller.updateUser.bind(controller)
  );

  router.get(
    '/users',
    validateRequest(GetUsersQueryValidation, 'query'),
    controller.getUsers.bind(controller)
  );

  router.post(
    '/validate/jersey-number',
    controller.validateJerseyNumber.bind(controller)
  );

  return router;
}