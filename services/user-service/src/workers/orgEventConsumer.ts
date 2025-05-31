import { subscribe } from '../lib/eventBus';
import { busPublish } from '../lib/eventBus';
import { getRepository } from 'typeorm';
import { Role } from '../entities/Role';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';

export const startOrgConsumer = () => {
  subscribe('organization.*', (msg: unknown) => {
    console.log('[User Service] organization event received', msg);
  });

  subscribe('organization.provisioned', async (msg: { orgId: string; name?: string }) => {
    console.log('[User Service] provisioning detected – bootstrapping admin for', msg.orgId);
    await handleOrgProvisioned(msg.orgId);
  });
};

export const handleOrgProvisioned = async (orgId: string) => {
  const roleRepo = getRepository(Role);
  const userRepo = getRepository(User);

  // Ensure global 'admin' role exists
  let adminRole = await roleRepo.findOne({ where: { name: 'admin' } });
  if (!adminRole) {
    adminRole = roleRepo.create({ name: 'admin', description: 'Organization administrator' });
    adminRole = await roleRepo.save(adminRole);
    console.log('[User Service] Default admin role created');
  }

  const adminEmail = `admin+${orgId}@example.com`;
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    adminUser = userRepo.create({
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      preferredLanguage: 'en',
      status: 'pending',
      organizationId: orgId,
      roles: [adminRole],
    });
    adminUser = await userRepo.save(adminUser);
    console.log('[User Service] Skeleton admin user created:', adminEmail);
  } else {
    // Ensure user has admin role
    const hasRole = (adminUser.roles || []).some((r) => r.id === adminRole.id);
    if (!hasRole) {
      adminUser.roles = [...(adminUser.roles || []), adminRole];
      await userRepo.save(adminUser);
    }
  }

  // Emit bootstrap complete event
  await busPublish('user.adminBootstrapComplete', { orgId, userId: adminUser.id });
  console.log('[User Service] user.adminBootstrapComplete emitted');
}; 