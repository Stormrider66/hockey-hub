import { Request, Response, NextFunction } from 'express';
import {
  listOrgSubscriptions,
  getSubscriptionById,
  createSubscription as repoCreateSubscription,
  updateSubscription as repoUpdateSubscription,
  cancelSubscription as repoCancelSubscription,
} from '../repositories/subscriptionRepository';

// TODO: replace with auth middleware extracting orgId and user roles
const getOrganizationId = (req: Request): string => {
  // For now accept header x-organization-id
  return (req.headers['x-organization-id'] as string) || '00000000-0000-0000-0000-000000000000';
};

export const listSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await listOrgSubscriptions(getOrganizationId(req) as any);
    res.json(subs);
  } catch (err) {
    next(err);
  }
};

export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subId } = req.params;
    const sub = await getSubscriptionById(subId as any);
    if (!sub) {
      return res.status(404).json({ error: true, message: 'Subscription not found' });
    }
    res.json(sub);
  } catch (err) {
    next(err);
  }
};

export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = getOrganizationId(req);
    const created = await repoCreateSubscription(orgId as any, req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subId } = req.params;
    const updated = await repoUpdateSubscription(subId as any, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subId } = req.params;
    const updated = await repoCancelSubscription(subId as any);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}; 