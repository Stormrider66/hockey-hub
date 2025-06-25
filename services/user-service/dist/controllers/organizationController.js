"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOrganizationHandler = exports.updateOrganizationHandler = exports.createOrganizationHandler = exports.getOrganizationHandler = exports.listOrganizationsHandler = void 0;
const organizationService_1 = require("../services/organizationService");
// Import specific DTO if needed for query typing before processing
// import { ListOrganizationsQueryDto } from '../dtos/organization.dto'; 
const serviceErrors_1 = require("../errors/serviceErrors");
// --- Organization Handlers --- //
const listOrganizationsHandler = (req, // Use Processed type for query
res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const organizationService = new organizationService_1.OrganizationService();
    try {
        // Authorization check handled by middleware
        const processedQuery = req.query; // Cast after validation
        const { organizations, total } = yield organizationService.listOrganizations(processedQuery);
        res.status(200).json({
            success: true,
            data: organizations,
            meta: {
                total,
                page: processedQuery.page,
                limit: processedQuery.limit,
                pages: Math.ceil(total / processedQuery.limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.listOrganizationsHandler = listOrganizationsHandler;
const getOrganizationHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const organizationService = new organizationService_1.OrganizationService();
    try {
        const user = req.user;
        const targetOrganizationId = req.params.organizationId;
        // Authorization check: Admin or member of the organization?
        if (!user.roles.includes('admin') && user.organizationId !== targetOrganizationId) {
            // Need a way to check if user belongs via team/role if not club_admin
            // For now, restrict to admin or matching organizationId (for club_admin)
            throw new serviceErrors_1.AuthorizationError('Cannot access this organization\'s details.');
        }
        // Fetch details including counts
        const organizationDetails = yield organizationService.getOrganizationDetailsWithCounts(targetOrganizationId);
        res.status(200).json({ success: true, data: organizationDetails });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'ORGANIZATION_NOT_FOUND' });
        }
        if (error instanceof serviceErrors_1.AuthorizationError) {
            return res.status(403).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
});
exports.getOrganizationHandler = getOrganizationHandler;
const createOrganizationHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const organizationService = new organizationService_1.OrganizationService();
    try {
        const user = req.user;
        // Authorization check already done by middleware (admin role required)
        const organization = yield organizationService.createOrganization(req.body, user.userId);
        res.status(201).json({ success: true, data: organization });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.ConflictError) {
            return res.status(409).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
});
exports.createOrganizationHandler = createOrganizationHandler;
const updateOrganizationHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const organizationService = new organizationService_1.OrganizationService();
    try {
        const user = req.user;
        const targetOrganizationId = req.params.organizationId;
        // Authorization check: Admin or Club Admin of this specific organization?
        if (!user.roles.includes('admin') && !(user.roles.includes('club_admin') && user.organizationId === targetOrganizationId)) {
            throw new serviceErrors_1.AuthorizationError('Not authorized to update this organization.');
        }
        // Prevent club_admin from changing status if that's a rule
        if (req.body.status && !user.roles.includes('admin')) {
            throw new serviceErrors_1.AuthorizationError('Only system administrators can change organization status.');
        }
        const organization = yield organizationService.updateOrganization(targetOrganizationId, req.body, user.userId);
        res.status(200).json({ success: true, data: organization });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'ORGANIZATION_NOT_FOUND' });
        }
        if (error instanceof serviceErrors_1.ConflictError || error instanceof serviceErrors_1.AuthorizationError) {
            return res.status(error.statusCode).json({ error: true, message: error.message, code: error.code });
        }
        next(error);
    }
});
exports.updateOrganizationHandler = updateOrganizationHandler;
const deleteOrganizationHandler = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const organizationService = new organizationService_1.OrganizationService();
    try {
        const user = req.user;
        // Authorization check already done by middleware (admin role required)
        yield organizationService.deleteOrganization(req.params.organizationId, user.userId);
        res.status(200).json({ success: true, message: 'Organization deleted successfully' });
    }
    catch (error) {
        if (error instanceof serviceErrors_1.NotFoundError) {
            return res.status(404).json({ error: true, message: error.message, code: 'ORGANIZATION_NOT_FOUND' });
        }
        next(error);
    }
});
exports.deleteOrganizationHandler = deleteOrganizationHandler;
//# sourceMappingURL=organizationController.js.map