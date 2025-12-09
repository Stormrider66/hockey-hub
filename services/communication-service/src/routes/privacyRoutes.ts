import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '@hockey-hub/shared-lib';
import { PrivacyService } from '../services/PrivacyService';
import { validationMiddleware } from '@hockey-hub/shared-lib';
import { IsUUID, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { MessagePrivacy, OnlineVisibility } from '../entities';

// DTOs
class BlockUserDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsEnum(MessagePrivacy)
  whoCanMessage?: MessagePrivacy;

  @IsOptional()
  @IsEnum(OnlineVisibility)
  onlineVisibility?: OnlineVisibility;

  @IsOptional()
  @IsBoolean()
  showReadReceipts?: boolean;

  @IsOptional()
  @IsBoolean()
  showTypingIndicators?: boolean;

  @IsOptional()
  @IsBoolean()
  showLastSeen?: boolean;

  @IsOptional()
  @IsBoolean()
  allowProfileViews?: boolean;

  @IsOptional()
  @IsBoolean()
  blockScreenshots?: boolean;
}

const router = Router();
const privacyService = new PrivacyService();

// Block a user
router.post(
  '/block',
  authMiddleware,
  validationMiddleware(BlockUserDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockerId = req.user!.id;
      const { userId, reason } = req.body;

      const blockedUser = await privacyService.blockUser(blockerId, userId, reason);
      res.status(201).json(blockedUser);
    } catch (error) {
      next(error);
    }
  }
);

// Unblock a user
router.delete(
  '/block/:userId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockerId = req.user!.id;
      const { userId } = req.params;

      await privacyService.unblockUser(blockerId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Get blocked users
router.get(
  '/blocked',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const blockedUsers = await privacyService.getBlockedUsers(userId);
      res.json(blockedUsers);
    } catch (error) {
      next(error);
    }
  }
);

// Check if user is blocked
router.get(
  '/blocked/:userId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockerId = req.user!.id;
      const { userId } = req.params;

      const isBlocked = await privacyService.isBlocked(blockerId, userId);
      res.json({ isBlocked });
    } catch (error) {
      next(error);
    }
  }
);

// Get privacy settings
router.get(
  '/settings',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const settings = await privacyService.getPrivacySettings(userId);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
);

// Update privacy settings
router.put(
  '/settings',
  authMiddleware,
  validationMiddleware(UpdatePrivacySettingsDto),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const settings = await privacyService.updatePrivacySettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
);

// Check if can message
router.get(
  '/can-message/:userId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const senderId = req.user!.id;
      const { userId } = req.params;

      const canMessage = await privacyService.canMessage(senderId, userId);
      res.json({ canMessage });
    } catch (error) {
      next(error);
    }
  }
);

// Check if can see online status
router.get(
  '/can-see-online/:userId',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const viewerId = req.user!.id;
      const { userId } = req.params;

      const canSeeOnline = await privacyService.canSeeOnlineStatus(viewerId, userId);
      res.json({ canSeeOnline });
    } catch (error) {
      next(error);
    }
  }
);

export default router;