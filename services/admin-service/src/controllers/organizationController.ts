import { Request, Response, NextFunction } from 'express';
import { runOrganizationProvisioningSaga } from '../sagas/organizationProvisioningSaga';

export const createOrganizationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, adminEmail } = req.body;
    if (!name || !adminEmail) {
      return res.status(400).json({ error: true, message: 'name and adminEmail required' });
    }
    const org = await runOrganizationProvisioningSaga({ orgName: name, adminEmail });
    res.status(201).json(org);
  } catch (err) {
    next(err);
  }
}; 