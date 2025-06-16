import { AppDataSource } from '../data-source';
import { Invoice } from '../entities/Invoice';
import { InvoiceStatus, UUID } from '@hockey-hub/types';

const repo = () => AppDataSource.getRepository(Invoice);

export const listOrgInvoices = async (organizationId: UUID, status?: InvoiceStatus) => {
  return repo().find({ where: { organizationId, ...(status ? { status } : {}) } as any });
};

export const getInvoiceById = async (invoiceId: UUID) => {
  return repo().findOne({ where: { id: invoiceId } });
};

export const markInvoicePaid = async (invoiceId: UUID, paymentDate: Date = new Date()) => {
  await repo().update(invoiceId, { status: 'PAID', paidDate: paymentDate.toISOString() } as any);
  return repo().findOne({ where: { id: invoiceId } });
}; 