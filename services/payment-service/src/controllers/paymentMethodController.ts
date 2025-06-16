import { Request, Response, NextFunction } from 'express';
import {
  listOrgPaymentMethods,
  createPaymentMethod as repoCreate,
  deletePaymentMethod as repoDelete,
  setDefaultPaymentMethod as repoSetDefault,
} from '../repositories/paymentMethodRepository';

const getOrgId = (req: Request) => (req.headers['x-organization-id'] as string) || 'org';

export const listPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const methods = await listOrgPaymentMethods(getOrgId(req) as any);
    res.json(methods);
  } catch (err) {
    next(err);
  }
};

export const createPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await repoCreate(getOrgId(req) as any, req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const deletePaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { methodId } = req.params;
    const ok = await repoDelete(methodId as any);
    res.status(ok ? 200 : 404).json({ success: ok });
  } catch (err) {
    next(err);
  }
};

export const setDefaultPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { methodId } = req.params;
    const updated = await repoSetDefault(getOrgId(req) as any, methodId as any);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}; 