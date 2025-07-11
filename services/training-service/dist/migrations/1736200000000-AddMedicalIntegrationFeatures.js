"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMedicalIntegrationFeatures1736200000000 = void 0;
class AddMedicalIntegrationFeatures1736200000000 {
    constructor() {
        this.name = 'AddMedicalIntegrationFeatures1736200000000';
    }
    async up(queryRunner) {
        // Add indexes for medical integration performance
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_override_medical_sync" 
      ON "workout_player_overrides" ("playerId", "medicalRecordId", "status")
      WHERE "overrideType" = 'medical';
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_override_effective_dates" 
      ON "workout_player_overrides" ("effectiveDate", "expiryDate")
      WHERE "status" IN ('approved', 'pending');
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_override_review_dates" 
      ON "workout_player_overrides" ("requiresReview", "nextReviewDate")
      WHERE "requiresReview" = true;
    `);
        // Add medical event tracking table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "medical_sync_events" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "eventType" varchar NOT NULL,
        "playerId" uuid NOT NULL,
        "restrictionId" uuid,
        "concernId" uuid,
        "overrideId" uuid,
        "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "processedAt" TIMESTAMP,
        "status" varchar DEFAULT 'pending',
        "details" jsonb,
        "error" jsonb,
        "retryCount" int DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_medical_sync_events" PRIMARY KEY ("id")
      );
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_medical_sync_events_status" 
      ON "medical_sync_events" ("status", "timestamp");
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_medical_sync_events_player" 
      ON "medical_sync_events" ("playerId", "eventType");
    `);
        // Add medical compliance audit table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "medical_compliance_audits" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "sessionId" uuid NOT NULL,
        "playerId" uuid NOT NULL,
        "checkDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "complianceStatus" varchar NOT NULL,
        "restrictionCount" int DEFAULT 0,
        "violationCount" int DEFAULT 0,
        "violations" jsonb,
        "recommendations" jsonb,
        "approvalStatus" varchar,
        "approvedBy" uuid,
        "approvedAt" TIMESTAMP,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_medical_compliance_audits" PRIMARY KEY ("id")
      );
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_compliance_audit_session" 
      ON "medical_compliance_audits" ("sessionId", "checkDate");
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_compliance_audit_player" 
      ON "medical_compliance_audits" ("playerId", "complianceStatus");
    `);
        // Add alternative exercise mappings table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercise_alternatives" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "originalExerciseId" uuid NOT NULL,
        "alternativeExerciseId" uuid NOT NULL,
        "reason" varchar NOT NULL,
        "suitabilityScore" int DEFAULT 0,
        "restrictionTypes" jsonb,
        "affectedBodyParts" jsonb,
        "loadMultiplier" decimal(3,2) DEFAULT 1.0,
        "restMultiplier" decimal(3,2) DEFAULT 1.0,
        "modifications" jsonb,
        "requiresSupervision" boolean DEFAULT false,
        "usageCount" int DEFAULT 0,
        "lastUsedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_exercise_alternatives" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exercise_alternatives_original" 
          FOREIGN KEY ("originalExerciseId") 
          REFERENCES "exercise_templates"("id") 
          ON DELETE CASCADE,
        CONSTRAINT "FK_exercise_alternatives_alternative" 
          FOREIGN KEY ("alternativeExerciseId") 
          REFERENCES "exercise_templates"("id") 
          ON DELETE CASCADE
      );
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_exercise_alternatives_unique" 
      ON "exercise_alternatives" ("originalExerciseId", "alternativeExerciseId");
    `);
        await queryRunner.query(`
      CREATE INDEX "idx_exercise_alternatives_suitability" 
      ON "exercise_alternatives" ("suitabilityScore" DESC);
    `);
        // Add trigger to update timestamps
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
        await queryRunner.query(`
      CREATE TRIGGER update_medical_sync_events_updated_at 
      BEFORE UPDATE ON "medical_sync_events"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
        await queryRunner.query(`
      CREATE TRIGGER update_medical_compliance_audits_updated_at 
      BEFORE UPDATE ON "medical_compliance_audits"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
        await queryRunner.query(`
      CREATE TRIGGER update_exercise_alternatives_updated_at 
      BEFORE UPDATE ON "exercise_alternatives"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    }
    async down(queryRunner) {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_exercise_alternatives_updated_at ON "exercise_alternatives"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_medical_compliance_audits_updated_at ON "medical_compliance_audits"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_medical_sync_events_updated_at ON "medical_sync_events"`);
        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "exercise_alternatives"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "medical_compliance_audits"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "medical_sync_events"`);
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_override_review_dates"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_override_effective_dates"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_override_medical_sync"`);
    }
}
exports.AddMedicalIntegrationFeatures1736200000000 = AddMedicalIntegrationFeatures1736200000000;
//# sourceMappingURL=1736200000000-AddMedicalIntegrationFeatures.js.map