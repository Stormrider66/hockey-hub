import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkoutAssignmentEntities1736200000000 implements MigrationInterface {
    name = 'AddWorkoutAssignmentEntities1736200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the tables already exist before creating them
        const hasWorkoutAssignmentsTable = await queryRunner.hasTable('workout_assignments');
        const hasWorkoutPlayerOverridesTable = await queryRunner.hasTable('workout_player_overrides');

        if (!hasWorkoutAssignmentsTable) {
            // Create workout_assignments table
            await queryRunner.query(`
                CREATE TABLE "workout_assignments" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "workoutSessionId" uuid NOT NULL,
                    "sessionTemplateId" uuid,
                    "playerId" character varying NOT NULL,
                    "teamId" character varying NOT NULL,
                    "organizationId" character varying NOT NULL,
                    "assignmentType" character varying NOT NULL CHECK ("assignmentType" IN ('individual','team','line','position','age_group','custom_group')),
                    "status" character varying NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft','active','completed','cancelled','archived')),
                    "workoutType" character varying CHECK ("workoutType" IN ('strength','cardio','flexibility','technical','recovery')),
                    "assignmentTarget" jsonb NOT NULL,
                    "effectiveDate" date NOT NULL,
                    "expiryDate" date,
                    "scheduledDate" TIMESTAMP NOT NULL,
                    "startedAt" TIMESTAMP,
                    "completedAt" TIMESTAMP,
                    "exercisesCompleted" integer,
                    "exercisesTotal" integer,
                    "recurrenceType" character varying NOT NULL DEFAULT 'none' CHECK ("recurrenceType" IN ('none','daily','weekly','biweekly','monthly','custom')),
                    "recurrencePattern" jsonb,
                    "createdBy" character varying NOT NULL,
                    "approvedBy" character varying,
                    "approvedAt" TIMESTAMP,
                    "priority" integer NOT NULL DEFAULT 0,
                    "loadProgression" jsonb,
                    "performanceThresholds" jsonb,
                    "allowPlayerOverrides" boolean NOT NULL DEFAULT true,
                    "requireMedicalClearance" boolean NOT NULL DEFAULT false,
                    "notifications" jsonb,
                    "parentAssignmentId" uuid,
                    "metadata" jsonb,
                    "eventMetadata" jsonb,
                    "eventBusMetadata" jsonb,
                    "lastSyncedAt" TIMESTAMP,
                    "version" integer NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "deletedAt" TIMESTAMP,
                    "updatedBy" character varying,
                    "deletedBy" character varying,
                    "lastRequestId" character varying,
                    "lastIpAddress" character varying,
                    CONSTRAINT "PK_workout_assignments" PRIMARY KEY ("id")
                )
            `);

            // Create indexes
            await queryRunner.query(`CREATE INDEX "idx_assignment_workout" ON "workout_assignments" ("workoutSessionId")`);
            await queryRunner.query(`CREATE INDEX "idx_assignment_organization_date" ON "workout_assignments" ("organizationId", "effectiveDate")`);
            await queryRunner.query(`CREATE INDEX "idx_assignment_type_status" ON "workout_assignments" ("assignmentType", "status")`);
            await queryRunner.query(`CREATE INDEX "idx_assignment_parent" ON "workout_assignments" ("parentAssignmentId")`);
            await queryRunner.query(`CREATE INDEX "idx_assignment_created_by" ON "workout_assignments" ("createdBy")`);
            await queryRunner.query(`CREATE INDEX "idx_assignment_parent_hierarchy" ON "workout_assignments" ("parentAssignmentId")`);
            await queryRunner.query(`CREATE UNIQUE INDEX "UQ_assignment_workout_org_date" ON "workout_assignments" ("workoutSessionId", "organizationId", "effectiveDate")`);

            // Add foreign key constraints
            await queryRunner.query(`ALTER TABLE "workout_assignments" ADD CONSTRAINT "FK_assignment_workout_session" FOREIGN KEY ("workoutSessionId") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
            await queryRunner.query(`ALTER TABLE "workout_assignments" ADD CONSTRAINT "FK_assignment_parent" FOREIGN KEY ("parentAssignmentId") REFERENCES "workout_assignments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        }

        if (!hasWorkoutPlayerOverridesTable) {
            // Create workout_player_overrides table
            await queryRunner.query(`
                CREATE TABLE "workout_player_overrides" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "workoutAssignmentId" uuid NOT NULL,
                    "playerId" character varying NOT NULL,
                    "overrideType" character varying NOT NULL CHECK ("overrideType" IN ('medical','performance','scheduling','custom')),
                    "status" character varying NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending','approved','rejected','expired')),
                    "effectiveDate" date NOT NULL,
                    "expiryDate" date,
                    "modifications" jsonb NOT NULL,
                    "medicalRecordId" uuid,
                    "medicalRestrictions" jsonb,
                    "requestedBy" character varying NOT NULL,
                    "requestedAt" TIMESTAMP NOT NULL,
                    "approvedBy" character varying,
                    "approvedAt" TIMESTAMP,
                    "approvalNotes" text,
                    "performanceData" jsonb,
                    "progressionOverride" jsonb,
                    "requiresReview" boolean NOT NULL DEFAULT false,
                    "nextReviewDate" date,
                    "communicationLog" jsonb,
                    "metadata" jsonb,
                    "eventBusMetadata" jsonb,
                    "version" integer NOT NULL DEFAULT 0,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "deletedAt" TIMESTAMP,
                    "createdBy" character varying,
                    "updatedBy" character varying,
                    "deletedBy" character varying,
                    "lastRequestId" character varying,
                    "lastIpAddress" character varying,
                    CONSTRAINT "PK_workout_player_overrides" PRIMARY KEY ("id")
                )
            `);

            // Create indexes
            await queryRunner.query(`CREATE INDEX "idx_override_assignment" ON "workout_player_overrides" ("workoutAssignmentId")`);
            await queryRunner.query(`CREATE INDEX "idx_override_player" ON "workout_player_overrides" ("playerId")`);
            await queryRunner.query(`CREATE INDEX "idx_override_player_date" ON "workout_player_overrides" ("playerId", "effectiveDate")`);
            await queryRunner.query(`CREATE INDEX "idx_override_type_status" ON "workout_player_overrides" ("overrideType", "status")`);
            await queryRunner.query(`CREATE INDEX "idx_override_medical_ref" ON "workout_player_overrides" ("medicalRecordId")`);
            await queryRunner.query(`CREATE UNIQUE INDEX "UQ_override_assignment_player_date" ON "workout_player_overrides" ("workoutAssignmentId", "playerId", "effectiveDate")`);

            // Add foreign key constraint
            await queryRunner.query(`ALTER TABLE "workout_player_overrides" ADD CONSTRAINT "FK_override_workout_assignment" FOREIGN KEY ("workoutAssignmentId") REFERENCES "workout_assignments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "workout_player_overrides" DROP CONSTRAINT IF EXISTS "FK_override_workout_assignment"`);
        await queryRunner.query(`ALTER TABLE "workout_assignments" DROP CONSTRAINT IF EXISTS "FK_assignment_parent"`);
        await queryRunner.query(`ALTER TABLE "workout_assignments" DROP CONSTRAINT IF EXISTS "FK_assignment_workout_session"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "workout_player_overrides"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workout_assignments"`);
    }
}