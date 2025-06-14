import { createOrganization } from '../repositories/organizationRepository';
import { enqueueMessage } from '../repositories/outboxRepository';
import { createBreaker } from '../lib/circuitBreaker';
import axios from 'axios';

// service URLs (could be env vars)
const USER_SVC = process.env.USER_SERVICE_URL || 'http://user-service:3001/api/v1';
const CAL_SVC = process.env.CALENDAR_SERVICE_URL || 'http://calendar-service:3003/api/v1';
const STATS_SVC = process.env.STATS_SERVICE_URL || 'http://statistics-service:3007/api/v1';
const PAYMENT_SVC = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3008/api/v1/payments';

const call = createBreaker((cfg: any) => axios(cfg));

export interface ProvisionInput {
  orgName: string;
  adminEmail: string;
  locale?: string;
}

export const runOrganizationProvisioningSaga = async (input: ProvisionInput) => {
  console.log('[OrgSaga] start');
  // Step 1 – create org row
  const org = await createOrganization(input.orgName);
  await enqueueMessage('organization.created', { orgId: org.id, name: org.name });

  try {
    // Step 2 – bootstrap admin user
    await call({ method: 'post', url: `${USER_SVC}/organizations/${org.id}/admin`, data: { email: input.adminEmail } });

    // Step 3 – create default calendar
    await call({ method: 'post', url: `${CAL_SVC}/organizations/${org.id}/root-calendar` });

    // Step 4 – allocate stats bucket
    await call({ method: 'post', url: `${STATS_SVC}/organizations`, data: { orgId: org.id } });

    // Step 5 – set up free plan subscription
    await call({ method: 'post', url: `${PAYMENT_SVC}/subscriptions`, data: { organizationId: org.id, planId: 'free', quantity: 1 } });

    await enqueueMessage('organization.provisioned', { orgId: org.id });
    console.log('[OrgSaga] success');
    return org;
  } catch (err) {
    console.error('[OrgSaga] failed, emitting rollback event', err);
    await enqueueMessage('organization.provisionFailed', { orgId: org.id, error: (err as Error).message });
    // Note: compensation actions could be triggered by listeners to this event.
    throw err;
  }
}; 