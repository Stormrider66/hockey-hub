"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialTrainingSchema1735500001000 = void 0;
const typeorm_1 = require("typeorm");
class InitialTrainingSchema1735500001000 {
    constructor() {
        this.name = 'InitialTrainingSchema1735500001000';
    }
    async up(queryRunner) {
        // Create exercise_templates table
        await queryRunner.createTable(new typeorm_1.Table({
            name: "exercise_templates",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "category",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "primaryUnit",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "equipment",
                    type: "text[]",
                    isNullable: true
                },
                {
                    name: "muscleGroups",
                    type: "text[]",
                    isNullable: true
                },
                {
                    name: "instructions",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "videoUrl",
                    type: "varchar",
                    length: "500",
                    isNullable: true
                },
                {
                    name: "imageUrl",
                    type: "varchar",
                    length: "500",
                    isNullable: true
                },
                {
                    name: "defaultParameters",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "progressionGuidelines",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true
                },
                {
                    name: "createdBy",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        // Create workout_sessions table
        await queryRunner.createTable(new typeorm_1.Table({
            name: "workout_sessions",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "title",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "description",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "createdBy",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "type",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "status",
                    type: "varchar",
                    length: "50",
                    default: "'scheduled'"
                },
                {
                    name: "scheduledDate",
                    type: "timestamp"
                },
                {
                    name: "location",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "teamId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "playerIds",
                    type: "text[]",
                    default: "'{}'"
                },
                {
                    name: "estimatedDuration",
                    type: "int"
                },
                {
                    name: "settings",
                    type: "jsonb",
                    default: "'{}'"
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "calendarEventId",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "organizationId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        // Create exercises table
        await queryRunner.createTable(new typeorm_1.Table({
            name: "exercises",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "workoutSessionId",
                    type: "uuid"
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "category",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "orderIndex",
                    type: "int"
                },
                {
                    name: "sets",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "reps",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "duration",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "restDuration",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "unit",
                    type: "varchar",
                    length: "50"
                },
                {
                    name: "targetValue",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "equipment",
                    type: "varchar",
                    length: "255",
                    isNullable: true
                },
                {
                    name: "instructions",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "videoUrl",
                    type: "varchar",
                    length: "500",
                    isNullable: true
                },
                {
                    name: "imageUrl",
                    type: "varchar",
                    length: "500",
                    isNullable: true
                },
                {
                    name: "intensityZones",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        // Create player_workout_loads table
        await queryRunner.createTable(new typeorm_1.Table({
            name: "player_workout_loads",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "workoutSessionId",
                    type: "uuid"
                },
                {
                    name: "playerId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "loadModifier",
                    type: "float",
                    default: 1.0
                },
                {
                    name: "exerciseModifications",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "isActive",
                    type: "boolean",
                    default: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        // Create workout_executions table
        await queryRunner.createTable(new typeorm_1.Table({
            name: "workout_executions",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "workoutSessionId",
                    type: "uuid"
                },
                {
                    name: "playerId",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "status",
                    type: "varchar",
                    length: "50",
                    default: "'not_started'"
                },
                {
                    name: "startedAt",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "completedAt",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "currentExerciseIndex",
                    type: "int",
                    default: 0
                },
                {
                    name: "currentSetNumber",
                    type: "int",
                    default: 0
                },
                {
                    name: "completionPercentage",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "metrics",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "deviceData",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        // Create exercise_executions table
        await queryRunner.createTable(new typeorm_1.Table({
            name: "exercise_executions",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "workoutExecutionId",
                    type: "uuid"
                },
                {
                    name: "exerciseId",
                    type: "uuid"
                },
                {
                    name: "exerciseName",
                    type: "varchar",
                    length: "255"
                },
                {
                    name: "setNumber",
                    type: "int"
                },
                {
                    name: "actualReps",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "actualWeight",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "actualDuration",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "actualDistance",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "actualPower",
                    type: "float",
                    isNullable: true
                },
                {
                    name: "restTaken",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "performanceMetrics",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "skipped",
                    type: "boolean",
                    default: false
                },
                {
                    name: "completedAt",
                    type: "timestamp"
                },
                {
                    name: "createdAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updatedAt",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);
        // Add foreign keys
        await queryRunner.createForeignKey("exercises", new typeorm_1.ForeignKey({
            columnNames: ["workoutSessionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "workout_sessions",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("player_workout_loads", new typeorm_1.ForeignKey({
            columnNames: ["workoutSessionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "workout_sessions",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("workout_executions", new typeorm_1.ForeignKey({
            columnNames: ["workoutSessionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "workout_sessions",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("exercise_executions", new typeorm_1.ForeignKey({
            columnNames: ["workoutExecutionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "workout_executions",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("exercise_executions", new typeorm_1.ForeignKey({
            columnNames: ["exerciseId"],
            referencedColumnNames: ["id"],
            referencedTableName: "exercises",
            onDelete: "CASCADE"
        }));
        // Add indexes for performance
        await queryRunner.createIndex("workout_sessions", new typeorm_1.Index({
            name: "IDX_workout_sessions_scheduledDate",
            columnNames: ["scheduledDate"]
        }));
        await queryRunner.createIndex("workout_sessions", new typeorm_1.Index({
            name: "IDX_workout_sessions_teamId",
            columnNames: ["teamId"]
        }));
        await queryRunner.createIndex("workout_sessions", new typeorm_1.Index({
            name: "IDX_workout_sessions_organizationId",
            columnNames: ["organizationId"]
        }));
        await queryRunner.createIndex("workout_sessions", new typeorm_1.Index({
            name: "IDX_workout_sessions_status",
            columnNames: ["status"]
        }));
        await queryRunner.createIndex("workout_sessions", new typeorm_1.Index({
            name: "IDX_workout_sessions_type",
            columnNames: ["type"]
        }));
        await queryRunner.createIndex("exercises", new typeorm_1.Index({
            name: "IDX_exercises_workoutSessionId_orderIndex",
            columnNames: ["workoutSessionId", "orderIndex"]
        }));
        await queryRunner.createIndex("player_workout_loads", new typeorm_1.Index({
            name: "IDX_player_workout_loads_workoutSessionId_playerId",
            columnNames: ["workoutSessionId", "playerId"],
            isUnique: true
        }));
        await queryRunner.createIndex("workout_executions", new typeorm_1.Index({
            name: "IDX_workout_executions_workoutSessionId_playerId",
            columnNames: ["workoutSessionId", "playerId"],
            isUnique: true
        }));
        await queryRunner.createIndex("workout_executions", new typeorm_1.Index({
            name: "IDX_workout_executions_playerId",
            columnNames: ["playerId"]
        }));
        await queryRunner.createIndex("workout_executions", new typeorm_1.Index({
            name: "IDX_workout_executions_status",
            columnNames: ["status"]
        }));
        await queryRunner.createIndex("exercise_executions", new typeorm_1.Index({
            name: "IDX_exercise_executions_workoutExecutionId",
            columnNames: ["workoutExecutionId"]
        }));
        await queryRunner.createIndex("exercise_executions", new typeorm_1.Index({
            name: "IDX_exercise_executions_exerciseId",
            columnNames: ["exerciseId"]
        }));
        await queryRunner.createIndex("exercise_templates", new typeorm_1.Index({
            name: "IDX_exercise_templates_category",
            columnNames: ["category"]
        }));
        await queryRunner.createIndex("exercise_templates", new typeorm_1.Index({
            name: "IDX_exercise_templates_isActive",
            columnNames: ["isActive"]
        }));
    }
    async down(queryRunner) {
        // Drop indexes
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_isActive");
        await queryRunner.dropIndex("exercise_templates", "IDX_exercise_templates_category");
        await queryRunner.dropIndex("exercise_executions", "IDX_exercise_executions_exerciseId");
        await queryRunner.dropIndex("exercise_executions", "IDX_exercise_executions_workoutExecutionId");
        await queryRunner.dropIndex("workout_executions", "IDX_workout_executions_status");
        await queryRunner.dropIndex("workout_executions", "IDX_workout_executions_playerId");
        await queryRunner.dropIndex("workout_executions", "IDX_workout_executions_workoutSessionId_playerId");
        await queryRunner.dropIndex("player_workout_loads", "IDX_player_workout_loads_workoutSessionId_playerId");
        await queryRunner.dropIndex("exercises", "IDX_exercises_workoutSessionId_orderIndex");
        await queryRunner.dropIndex("workout_sessions", "IDX_workout_sessions_type");
        await queryRunner.dropIndex("workout_sessions", "IDX_workout_sessions_status");
        await queryRunner.dropIndex("workout_sessions", "IDX_workout_sessions_organizationId");
        await queryRunner.dropIndex("workout_sessions", "IDX_workout_sessions_teamId");
        await queryRunner.dropIndex("workout_sessions", "IDX_workout_sessions_scheduledDate");
        // Drop tables
        await queryRunner.dropTable("exercise_executions");
        await queryRunner.dropTable("workout_executions");
        await queryRunner.dropTable("player_workout_loads");
        await queryRunner.dropTable("exercises");
        await queryRunner.dropTable("workout_sessions");
        await queryRunner.dropTable("exercise_templates");
    }
}
exports.InitialTrainingSchema1735500001000 = InitialTrainingSchema1735500001000;
//# sourceMappingURL=1735500001000-InitialTrainingSchema.js.map