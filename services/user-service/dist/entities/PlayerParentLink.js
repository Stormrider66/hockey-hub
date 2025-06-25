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
exports.PlayerParentLink = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let PlayerParentLink = class PlayerParentLink {
};
exports.PlayerParentLink = PlayerParentLink;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PlayerParentLink.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'uuid' }),
    __metadata("design:type", String)
], PlayerParentLink.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.parentLinks, { nullable: false, lazy: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Promise)
], PlayerParentLink.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'child_id', type: 'uuid' }),
    __metadata("design:type", String)
], PlayerParentLink.prototype, "childId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.childLinks, { nullable: false, lazy: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'child_id' }),
    __metadata("design:type", Promise)
], PlayerParentLink.prototype, "child", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['parent', 'guardian', 'other'], default: 'parent' }),
    __metadata("design:type", String)
], PlayerParentLink.prototype, "relationship", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_primary', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PlayerParentLink.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], PlayerParentLink.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp with time zone' }),
    __metadata("design:type", Date)
], PlayerParentLink.prototype, "updatedAt", void 0);
exports.PlayerParentLink = PlayerParentLink = __decorate([
    (0, typeorm_1.Entity)('player_parent_links'),
    (0, typeorm_1.Index)(['parentId']),
    (0, typeorm_1.Index)(['childId']),
    (0, typeorm_1.Index)(['isPrimary']),
    (0, typeorm_1.Index)(['parentId', 'childId'], { unique: true }) // Composite unique index
    ,
    (0, typeorm_1.Check)(`"relationship" IN ('parent', 'guardian', 'other')`)
], PlayerParentLink);
//# sourceMappingURL=PlayerParentLink.js.map