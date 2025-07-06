"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServiceClient = void 0;
const ServiceClient_1 = require("./ServiceClient");
class UserServiceClient extends ServiceClient_1.ServiceClient {
    constructor(baseURL) {
        super({
            serviceName: 'user-service',
            serviceVersion: '1.0.0',
            baseURL,
        });
    }
    // User operations
    async getUser(query) {
        const params = new URLSearchParams();
        if (query.includeOrganizations)
            params.append('includeOrganizations', 'true');
        if (query.includeTeams)
            params.append('includeTeams', 'true');
        return this.get(`/users/${query.userId}?${params.toString()}`);
    }
    async getUsers(query) {
        return this.get('/users', { params: query });
    }
    async createUser(data) {
        return this.post('/users', data);
    }
    async updateUser(userId, data) {
        return this.patch(`/users/${userId}`, data);
    }
    async deleteUser(userId) {
        return this.delete(`/users/${userId}`);
    }
    // Organization operations
    async getUserOrganizations(userId) {
        return this.get(`/users/${userId}/organizations`);
    }
    async addUserToOrganization(userId, organizationId, role) {
        return this.post(`/users/${userId}/organizations`, {
            organizationId,
            role,
        });
    }
    async removeUserFromOrganization(userId, organizationId) {
        return this.delete(`/users/${userId}/organizations/${organizationId}`);
    }
    // Team operations
    async getUserTeams(userId) {
        return this.get(`/users/${userId}/teams`);
    }
    async getTeamMembers(teamId) {
        return this.get(`/teams/${teamId}/members`);
    }
    async addUserToTeam(teamId, userId, role, jerseyNumber, position) {
        return this.post(`/teams/${teamId}/members`, {
            userId,
            role,
            jerseyNumber,
            position,
        });
    }
    async removeUserFromTeam(teamId, userId) {
        return this.delete(`/teams/${teamId}/members/${userId}`);
    }
    // Bulk operations
    async getUsersByIds(userIds) {
        return this.post('/users/bulk', { userIds });
    }
    async getUsersByOrganization(organizationId, role) {
        const params = role ? { role } : {};
        return this.get(`/organizations/${organizationId}/users`, {
            params,
        });
    }
    async getUsersByTeam(teamId, role) {
        const params = role ? { role } : {};
        return this.get(`/teams/${teamId}/users`, { params });
    }
}
exports.UserServiceClient = UserServiceClient;
//# sourceMappingURL=UserServiceClient.js.map