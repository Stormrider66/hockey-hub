"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddOrganizationIdToExerciseTemplate1735750000001 = void 0;
const typeorm_1 = require("typeorm");
class AddOrganizationIdToExerciseTemplate1735750000001 {
    constructor() {
        this.name = 'AddOrganizationIdToExerciseTemplate1735750000001';
    }
    async up(queryRunner) {
        // Add organizationId column
        await queryRunner.addColumn("exercise_templates", new typeorm_1.TableColumn({
            name: "organizationId",
            type: "uuid",
            isNullable: true
        }));
        // Add index on organizationId for filtering
        await queryRunner.createIndex("exercise_templates", new typeorm_1.Index({
            name: "IDX_exercise_templates_organizationId",
            columnNames: ["organizationId"]
        }));
        // Add composite index for organization-specific queries
        await queryRunner.createIndex("exercise_templates", new typeorm_1.Index({
            name: "IDX_exercise_templates_organizationId_category",
            columnNames: ["organizationId", "category"]
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_organizationId_category");
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_organizationId");
        await queryRunner.dropColumn("exercise_templates", "organizationId");
    }
}
exports.AddOrganizationIdToExerciseTemplate1735750000001 = AddOrganizationIdToExerciseTemplate1735750000001;
//# sourceMappingURL=1735750000001-AddOrganizationIdToExerciseTemplate.js.map