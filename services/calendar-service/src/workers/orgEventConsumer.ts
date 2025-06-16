import { subscribe } from '../lib/eventBus';
import { createLocation, findAll } from '../repositories/locationRepository';
import { createResourceType, findAll as findResourceTypes } from '../repositories/resourceTypeRepository';
import { createResource, findAll as findResources } from '../repositories/resourceRepository';
import { ResourceType as ResourceTypeEntity } from '../entities/ResourceType';
import { Resource as ResourceEntity } from '../entities/Resource';

interface OrgEvent { orgId: string; name?: string; }

export const startOrgConsumer = () => {
  subscribe('organization.*', (msg: unknown) => {
    const evt = msg as OrgEvent;
    console.log('[Calendar] organization event received', evt);

    if ('orgId' in evt && (msg as any).topic === undefined) {
      // Handle by subject because NATS subject contains it. We rely on wildcard
    }
  });
  // Explicit handler for provisioned
  subscribe('organization.provisioned', async (msg: OrgEvent) => {
    console.log('[Calendar] provisioning completed – creating root calendar', msg.orgId);
    await handleOrgProvisioned(msg.orgId);
  });
};

export const handleOrgProvisioned = async (orgId: string) => {
  // Ensure default Location exists ("Default Location")
  let [location] = await findAll({ organizationId: orgId });
  if (!location) {
    location = await createLocation({ organizationId: orgId as any, name: 'Default Location' });
    console.log('[Calendar] Default Location created');
  }

  // Ensure default ResourceType exists ("Ice Rink")
  const existingTypes = await findResourceTypes({ organizationId: orgId });
  let iceRinkType: ResourceTypeEntity | undefined = existingTypes.find((t: ResourceTypeEntity) => t.name === 'Ice Rink');
  if (!iceRinkType) {
    iceRinkType = await createResourceType({ organizationId: orgId as any, name: 'Ice Rink' });
    console.log('[Calendar] Default ResourceType "Ice Rink" created');
  }

  // Ensure default Resource exists ("Main Rink")
  const existingResources = await findResources({ organizationId: orgId, resourceTypeId: iceRinkType.id });
  const mainRinkExists = existingResources.some((r: ResourceEntity) => r.name === 'Main Rink');
  if (!mainRinkExists) {
    await createResource({
      organizationId: orgId as any,
      name: 'Main Rink',
      resourceTypeId: iceRinkType.id,
      locationId: location.id,
      isBookable: true,
    });
    console.log('[Calendar] Default Resource "Main Rink" created');
  }
}; 