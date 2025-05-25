import { Request, Response, NextFunction } from 'express';
import {
  listOrgInvoices,
  getInvoiceById,
  markInvoicePaid,
} from '../repositories/invoiceRepository';

const getOrgId = (req: Request) => (req.headers['x-organization-id'] as string) || 'org';

export const listInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as any;
    const invoices = await listOrgInvoices(getOrgId(req) as any, status);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

export const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await getInvoiceById(invoiceId as any);
    if (!invoice) return res.status(404).json({ error: true, message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

export const payInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId } = req.params;
    const updated = await markInvoicePaid(invoiceId as any);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}; 