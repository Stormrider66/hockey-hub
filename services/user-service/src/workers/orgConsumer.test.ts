import { handleOrgProvisioned } from './orgEventConsumer';
import { Role } from '../entities/Role';
import { User } from '../entities/User';
import { busPublish } from '../lib/eventBus';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

jest.mock('uuid', () => ({
  v4: () => '00000000-0000-0000-0000-000000000000',
  validate: () => true,
  NIL: '00000000-0000-0000-0000-000000000000',
}));

const roleRepoMock = {
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'role-1' })),
  save: jest.fn().mockImplementation((x) => Promise.resolve({ ...x, id: x.id || 'role-1' })),
};
const userRepoMock = {
  findOne: jest.fn(),
  create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'user-1' })),
  save: jest.fn().mockImplementation((x) => Promise.resolve({ ...x, id: x.id || 'user-1' })),
};

jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getRepository: jest.fn((entity: any) => {
      if (entity === Role) return roleRepoMock;
      if (entity === User) return userRepoMock;
      return {};
    }),
  };
});

// Mock event bus publish
jest.mock('../lib/eventBus', () => ({
  busPublish: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn(),
}));

describe('handleOrgProvisioned', () => {
  const ORG_ID = 'org-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates admin role and user when they do not exist', async () => {
    roleRepoMock.findOne.mockResolvedValue(undefined);
    userRepoMock.findOne.mockResolvedValue(undefined);

    await handleOrgProvisioned(ORG_ID);

    expect(roleRepoMock.create).toHaveBeenCalledWith({ name: 'admin', description: 'Organization administrator' });
    expect(userRepoMock.create).toHaveBeenCalled();
    expect(busPublish).toHaveBeenCalledWith('user.adminBootstrapComplete', expect.objectContaining({ orgId: ORG_ID }));
  });

  it('skips creation when admin user already exists', async () => {
    roleRepoMock.findOne.mockResolvedValue({ id: 'role-1', name: 'admin' });
    userRepoMock.findOne.mockResolvedValue({ id: 'user-1', email: `admin+${ORG_ID}@example.com`, roles: [{ id: 'role-1' }] });

    await handleOrgProvisioned(ORG_ID);

    expect(roleRepoMock.create).not.toHaveBeenCalled();
    expect(userRepoMock.create).not.toHaveBeenCalled();
  });
}); 