jest.mock('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000000',
  validate: () => true,
  NIL: '00000000-0000-0000-0000-000000000000',
}));

import { handleOrgProvisioned } from './orgEventConsumer';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { Subscription } from '../entities/Subscription';

const planRepoMock = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const subRepoMock = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getRepository: jest.fn((entity: any) => {
      if (entity === SubscriptionPlan) return planRepoMock;
      if (entity === Subscription) return subRepoMock;
      return {};
    }),
  };
});

describe('handleOrgProvisioned (Payment)', () => {
  const ORG_ID = 'org-999';
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates free trial plan and subscription when absent', async () => {
    planRepoMock.findOne.mockResolvedValue(undefined);
    planRepoMock.create.mockImplementation((dto: any) => ({ id: 'plan-1', ...dto }));
    planRepoMock.save.mockResolvedValue({ id: 'plan-1', name: 'Free Trial' });

    subRepoMock.findOne.mockResolvedValue(undefined);
    subRepoMock.create.mockImplementation((dto: any) => ({ id: 'sub-1', ...dto }));
    subRepoMock.save.mockResolvedValue({ id: 'sub-1' });

    await handleOrgProvisioned(ORG_ID);

    expect(planRepoMock.create).toHaveBeenCalled();
    expect(planRepoMock.save).toHaveBeenCalled();
    expect(subRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({ organizationId: ORG_ID }));
    expect(subRepoMock.save).toHaveBeenCalled();
  });

  it('skips if subscription exists', async () => {
    planRepoMock.findOne.mockResolvedValue({ id: 'plan-1', name: 'Free Trial' });
    subRepoMock.findOne.mockResolvedValue({ id: 'existing-sub' });

    await handleOrgProvisioned(ORG_ID);

    expect(subRepoMock.create).not.toHaveBeenCalled();
  });
}); 