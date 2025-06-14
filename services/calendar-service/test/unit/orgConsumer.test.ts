import { handleOrgProvisioned } from '../../src/workers/orgEventConsumer';

// Mock repositories
jest.mock('../../src/repositories/locationRepository', () => ({
  findAll: jest.fn(),
  createLocation: jest.fn(),
}));

jest.mock('../../src/repositories/resourceTypeRepository', () => ({
  findAll: jest.fn(),
  createResourceType: jest.fn(),
}));

jest.mock('../../src/repositories/resourceRepository', () => ({
  findAll: jest.fn(),
  createResource: jest.fn(),
}));

// Import mocks
import { findAll as findLocations, createLocation } from '../../src/repositories/locationRepository';
import { findAll as findResourceTypes, createResourceType } from '../../src/repositories/resourceTypeRepository';
import { findAll as findResources, createResource } from '../../src/repositories/resourceRepository';

describe('handleOrgProvisioned', () => {
  const ORG_ID = 'org-123';
  const LOCATION = { id: 'loc-1', organizationId: ORG_ID, name: 'Default Location' };
  const RESOURCE_TYPE = { id: 'rt-1', organizationId: ORG_ID, name: 'Ice Rink' };
  const RESOURCE = { id: 'res-1', organizationId: ORG_ID, name: 'Main Rink', resourceTypeId: 'rt-1', locationId: 'loc-1' };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates defaults when none exist', async () => {
    (findLocations as jest.Mock).mockResolvedValue([]);
    (createLocation as jest.Mock).mockResolvedValue(LOCATION);

    (findResourceTypes as jest.Mock).mockResolvedValue([]);
    (createResourceType as jest.Mock).mockResolvedValue(RESOURCE_TYPE);

    (findResources as jest.Mock).mockResolvedValue([]);
    (createResource as jest.Mock).mockResolvedValue(RESOURCE);

    await handleOrgProvisioned(ORG_ID);

    expect(createLocation).toHaveBeenCalledWith({ organizationId: ORG_ID, name: 'Default Location' });
    expect(createResourceType).toHaveBeenCalledWith({ organizationId: ORG_ID, name: 'Ice Rink' });
    expect(createResource).toHaveBeenCalledWith({
      organizationId: ORG_ID,
      name: 'Main Rink',
      resourceTypeId: 'rt-1',
      locationId: 'loc-1',
      isBookable: true,
    });
  });

  it('does not create when resources already exist', async () => {
    (findLocations as jest.Mock).mockResolvedValue([LOCATION]);
    (findResourceTypes as jest.Mock).mockResolvedValue([RESOURCE_TYPE]);
    (findResources as jest.Mock).mockResolvedValue([RESOURCE]);

    await handleOrgProvisioned(ORG_ID);

    expect(createLocation).not.toHaveBeenCalled();
    expect(createResourceType).not.toHaveBeenCalled();
    expect(createResource).not.toHaveBeenCalled();
  });
}); 