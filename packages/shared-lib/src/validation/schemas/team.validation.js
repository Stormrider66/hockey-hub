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
exports.TeamScheduleValidation = exports.TeamRosterValidation = exports.UpdateTeamValidation = exports.CreateTeamValidation = exports.TeamType = void 0;
const class_validator_1 = require("class-validator");
const decorators_1 = require("../decorators");
var TeamType;
(function (TeamType) {
    TeamType["YOUTH"] = "youth";
    TeamType["JUNIOR"] = "junior";
    TeamType["SENIOR"] = "senior";
    TeamType["RECREATIONAL"] = "recreational";
})(TeamType || (exports.TeamType = TeamType = {}));
class CreateTeamValidation {
}
exports.CreateTeamValidation = CreateTeamValidation;
__decorate([
    (0, decorators_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Organization ID is required' }),
    __metadata("design:type", String)
], CreateTeamValidation.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Team name is required' }),
    (0, class_validator_1.Length)(2, 255, { message: 'Team name must be between 2 and 255 characters' }),
    __metadata("design:type", String)
], CreateTeamValidation.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TeamType),
    (0, class_validator_1.IsNotEmpty)({ message: 'Team type is required' }),
    __metadata("design:type", String)
], CreateTeamValidation.prototype, "teamType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsAgeGroup)(),
    __metadata("design:type", String)
], CreateTeamValidation.prototype, "ageGroup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}(-\d{4})?$/, {
        message: 'Season must be in format YYYY or YYYY-YYYY'
    }),
    __metadata("design:type", String)
], CreateTeamValidation.prototype, "season", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Invalid logo URL' }),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], CreateTeamValidation.prototype, "logoUrl", void 0);
class UpdateTeamValidation {
}
exports.UpdateTeamValidation = UpdateTeamValidation;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 255),
    __metadata("design:type", String)
], UpdateTeamValidation.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TeamType),
    __metadata("design:type", String)
], UpdateTeamValidation.prototype, "teamType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsAgeGroup)(),
    __metadata("design:type", String)
], UpdateTeamValidation.prototype, "ageGroup", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{4}(-\d{4})?$/),
    __metadata("design:type", String)
], UpdateTeamValidation.prototype, "season", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], UpdateTeamValidation.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTeamValidation.prototype, "isActive", void 0);
class TeamRosterValidation {
}
exports.TeamRosterValidation = TeamRosterValidation;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10, { message: 'Minimum roster size is 10 players' }),
    (0, class_validator_1.Max)(50, { message: 'Maximum roster size is 50 players' }),
    __metadata("design:type", Number)
], TeamRosterValidation.prototype, "minPlayers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], TeamRosterValidation.prototype, "maxPlayers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], TeamRosterValidation.prototype, "minCoaches", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], TeamRosterValidation.prototype, "maxCoaches", void 0);
class TeamScheduleValidation {
}
exports.TeamScheduleValidation = TeamScheduleValidation;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Practice time must be in HH:MM format'
    }),
    __metadata("design:type", String)
], TeamScheduleValidation.prototype, "defaultPracticeTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], {
        each: true,
        message: 'Invalid day of week'
    }),
    __metadata("design:type", Array)
], TeamScheduleValidation.prototype, "practiceDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(30),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], TeamScheduleValidation.prototype, "practiceDurationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.IsUUID)(),
    __metadata("design:type", String)
], TeamScheduleValidation.prototype, "defaultLocationId", void 0);
//# sourceMappingURL=team.validation.js.map