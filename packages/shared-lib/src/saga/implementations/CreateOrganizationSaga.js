"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOrganizationSaga = void 0;
class CreateOrganizationSaga {
    static definition(userServiceClient) {
        const steps = [
            {
                name: 'createOrganization',
                execute: async (data, context) => {
                    // Create organization in user service
                    const org = await userServiceClient.post('/organizations', data.organization);
                    context.metadata.organizationId = org.id;
                },
                compensate: async (_, context) => {
                    // Delete the organization if it was created
                    if (context.metadata.organizationId) {
                        await userServiceClient.delete(`/organizations/${context.metadata.organizationId}`);
                    }
                },
                retryable: true,
                maxRetries: 3,
                timeout: 30000,
            },
            {
                name: 'createAdminUser',
                execute: async (data, context) => {
                    // Create admin user
                    const user = await userServiceClient.createUser({
                        ...data.adminUser,
                    });
                    // Add user to organization as admin
                    await userServiceClient.addUserToOrganization(user.id, context.metadata.organizationId, 'super_admin');
                    context.metadata.adminUserId = user.id;
                },
                compensate: async (_, context) => {
                    // Delete the admin user if it was created
                    if (context.metadata.adminUserId) {
                        await userServiceClient.deleteUser(context.metadata.adminUserId);
                    }
                },
                retryable: true,
                maxRetries: 3,
            },
            {
                name: 'createDefaultTeams',
                execute: async (data, context) => {
                    if (!data.defaultTeams || data.defaultTeams.length === 0) {
                        return;
                    }
                    const teamIds = [];
                    for (const teamData of data.defaultTeams) {
                        const team = await userServiceClient.post('/teams', {
                            organizationId: context.metadata.organizationId,
                            ...teamData,
                            season: new Date().getFullYear().toString(),
                        });
                        teamIds.push(team.id);
                    }
                    context.metadata.teamIds = teamIds;
                },
                compensate: async (_, context) => {
                    // Delete created teams
                    if (context.metadata.teamIds) {
                        for (const teamId of context.metadata.teamIds) {
                            try {
                                await userServiceClient.delete(`/teams/${teamId}`);
                            }
                            catch (error) {
                                console.error(`Failed to delete team ${teamId}:`, error);
                            }
                        }
                    }
                },
                retryable: true,
                maxRetries: 2,
            },
            {
                name: 'setupPayment',
                execute: async (_, context) => {
                    // Create subscription in payment service
                    // This would call the payment service client
                    console.log('Setting up payment for organization:', context.metadata.organizationId);
                    // await paymentServiceClient.createSubscription({...});
                },
                compensate: async (_, context) => {
                    // Cancel subscription
                    console.log('Cancelling payment setup for organization:', context.metadata.organizationId);
                    // await paymentServiceClient.cancelSubscription({...});
                },
                retryable: true,
                maxRetries: 3,
            },
            {
                name: 'setupInitialConfiguration',
                execute: async (_, context) => {
                    // Setup initial configuration in admin service
                    console.log('Setting up initial configuration for organization:', context.metadata.organizationId);
                    // await adminServiceClient.setupOrganization({...});
                },
                compensate: async (_, context) => {
                    // Remove configuration
                    console.log('Removing configuration for organization:', context.metadata.organizationId);
                    // await adminServiceClient.removeOrganizationConfig({...});
                },
                retryable: true,
            },
        ];
        return {
            name: 'createOrganization',
            steps,
            onSuccess: async (_, context) => {
                console.log('Organization created successfully:', {
                    organizationId: context.metadata.organizationId,
                    adminUserId: context.metadata.adminUserId,
                    teamIds: context.metadata.teamIds,
                });
            },
            onFailure: async (_, context, error) => {
                console.error('Failed to create organization:', error);
                console.log('Compensation completed for:', context.completedSteps);
            },
        };
    }
}
exports.CreateOrganizationSaga = CreateOrganizationSaga;
//# sourceMappingURL=CreateOrganizationSaga.js.map