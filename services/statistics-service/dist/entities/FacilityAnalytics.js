"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilityAnalytics = void 0;
const typeorm_1 = require("typeorm");
const shared_lib_1 = require("@hockey-hub/shared-lib");
let FacilityAnalytics = class FacilityAnalytics extends shared_lib_1.AuditableEntity {
    constructor() {
        super(...arguments);
        // Utilization Metrics
        this.utilizationRate = 0; // percentage
        this.totalBookings = 0;
        this.successfulBookings = 0;
        this.cancelledBookings = 0;
        this.noShowBookings = 0;
        this.totalHoursBooked = 0;
        this.totalHoursAvailable = 0;
        this.peakHoursUtilization = 0;
        this.offPeakHoursUtilization = 0;
        // Revenue Analytics
        this.totalRevenue = 0;
        this.revenuePerHour = 0;
        this.revenuePerBooking = 0;
        this.repeatCustomerRate = 0; // percentage
        this.uniqueCustomers = 0;
        this.customerSatisfactionScore = 0;
        // Conflict Analysis
        this.bookingConflicts = 0;
        this.doubleBookings = 0;
        this.overbookings = 0;
        this.conflictResolutionTime = 0; // average minutes
        // Metadata
        this.status = 'active';
    }
};
exports.FacilityAnalytics = FacilityAnalytics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "facilityId", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)('date'),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], FacilityAnalytics.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "facilityType", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 100 }),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "facilityName", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "utilizationRate", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "totalBookings", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "successfulBookings", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "cancelledBookings", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "noShowBookings", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "totalHoursBooked", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "totalHoursAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "peakHoursUtilization", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "offPeakHoursUtilization", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], FacilityAnalytics.prototype, "hourlyUsage", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], FacilityAnalytics.prototype, "dailyPatterns", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 20, nullable: true }),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "peakDay", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "peakHour", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "totalRevenue", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "revenuePerHour", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "revenuePerBooking", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "revenueCategory", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], FacilityAnalytics.prototype, "revenueBreakdown", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "costPerHour", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "profitMargin", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "averageBookingDuration", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "averageAdvanceBooking", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "repeatCustomerRate", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "uniqueCustomers", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "customerSatisfactionScore", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "turnoverRate", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "setupTime", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "cleanupTime", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "maintenanceTime", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "downtime", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], FacilityAnalytics.prototype, "optimizationSuggestions", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "unutilizedCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 8, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "revenueOpportunity", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "bookingConflicts", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "doubleBookings", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "overbookings", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "conflictResolutionTime", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], FacilityAnalytics.prototype, "equipmentUsage", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Array)
], FacilityAnalytics.prototype, "staffAssignment", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "temperature", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "humidity", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 8, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "energyCost", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], FacilityAnalytics.prototype, "energyEfficiency", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 50, default: 'active' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], FacilityAnalytics.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('jsonb', { nullable: true }),
    __metadata("design:type", Object)
], FacilityAnalytics.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FacilityAnalytics.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], FacilityAnalytics.prototype, "updatedAt", void 0);
exports.FacilityAnalytics = FacilityAnalytics = __decorate([
    (0, typeorm_1.Entity)('facility_analytics'),
    (0, typeorm_1.Index)(['facilityId', 'date']),
    (0, typeorm_1.Index)(['organizationId', 'facilityType', 'date']),
    (0, typeorm_1.Index)(['date', 'revenueCategory'])
], FacilityAnalytics);
//# sourceMappingURL=FacilityAnalytics.js.map