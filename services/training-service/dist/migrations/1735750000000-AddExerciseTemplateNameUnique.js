"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddExerciseTemplateNameUnique1735750000000 = void 0;
const typeorm_1 = require("typeorm");
class AddExerciseTemplateNameUnique1735750000000 {
    constructor() {
        this.name = 'AddExerciseTemplateNameUnique1735750000000';
    }
    async up(queryRunner) {
        // Add unique index on exercise template name
        await queryRunner.createIndex("exercise_templates", new typeorm_1.Index({
            name: "UQ_exercise_templates_name",
            columnNames: ["name"],
            isUnique: true
        }));
        // Add index on name for search performance
        await queryRunner.createIndex("exercise_templates", new typeorm_1.Index({
            name: "IDX_exercise_templates_name",
            columnNames: ["name"]
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_name");
        await queryRunner.dropIndex("exercise_templates", "UQ_exercise_templates_name");
    }
}
exports.AddExerciseTemplateNameUnique1735750000000 = AddExerciseTemplateNameUnique1735750000000;
//# sourceMappingURL=1735750000000-AddExerciseTemplateNameUnique.js.map