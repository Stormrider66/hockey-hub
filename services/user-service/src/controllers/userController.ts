import { Request, Response, NextFunction } from 'express';
import { 
  ValidationService,
  CreateUserValidation,
  UpdateUserValidation,
  GetUsersQueryValidation,
  BusinessRules,
  validateRequest,
  SuccessResponseDTO,
  ErrorResponseDTO
} from '@hockey-hub/shared-lib';
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

      res.status(201).json(response);
    } catch (error) {
      next(error);
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

      res.json(response);
    } catch (error) {
      next(error);
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

      res.json(response);
    } catch (error) {
      next(error);
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

      res.json(response);
    } catch (error) {
      next(error);
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

    return result.map(r => r.jerseyNumber);
  }
}

// Router setup with validation middleware
import { Router } from 'express';

export function createUserRouter(): Router {
  const router = Router();
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