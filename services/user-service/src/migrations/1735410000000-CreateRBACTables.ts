import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRBACTables1735410000000 implements MigrationInterface {
  name = 'CreateRBACTables1735410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying NOT NULL,
        "resource" character varying NOT NULL,
        "action" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_permission_name" UNIQUE ("name"),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id")
      )
    `);

    // Create index on permissions
    await queryRunner.query(`CREATE INDEX "IDX_permission_name" ON "permissions" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_permission_resource_action" ON "permissions" ("resource", "action")`);

    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "displayName" character varying NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_role_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Create index on roles
    await queryRunner.query(`CREATE INDEX "IDX_role_name" ON "roles" ("name")`);

    // Create role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "roleId" uuid NOT NULL,
        "permissionId" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("roleId", "permissionId")
      )
    `);

    // Create indexes on junction table
    await queryRunner.query(`CREATE INDEX "IDX_role_permissions_roleId" ON "role_permissions" ("roleId")`);
    await queryRunner.query(`CREATE INDEX "IDX_role_permissions_permissionId" ON "role_permissions" ("permissionId")`);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "FK_role_permissions_role" 
      FOREIGN KEY ("roleId") 
      REFERENCES "roles"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "role_permissions" 
      ADD CONSTRAINT "FK_role_permissions_permission" 
      FOREIGN KEY ("permissionId") 
      REFERENCES "permissions"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Add roleId to user_organizations table to link users to roles
    await queryRunner.query(`
      ALTER TABLE "user_organizations" 
      ADD COLUMN "roleId" uuid
    `);

    // Add foreign key for roleId
    await queryRunner.query(`
      ALTER TABLE "user_organizations" 
      ADD CONSTRAINT "FK_user_organizations_role" 
      FOREIGN KEY ("roleId") 
      REFERENCES "roles"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create index on roleId
    await queryRunner.query(`CREATE INDEX "IDX_user_organizations_roleId" ON "user_organizations" ("roleId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "user_organizations" DROP CONSTRAINT "FK_user_organizations_role"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permission"`);
    await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_role"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_user_organizations_roleId"`);
    await queryRunner.query(`DROP INDEX "IDX_role_permissions_permissionId"`);
    await queryRunner.query(`DROP INDEX "IDX_role_permissions_roleId"`);
    await queryRunner.query(`DROP INDEX "IDX_role_name"`);
    await queryRunner.query(`DROP INDEX "IDX_permission_resource_action"`);
    await queryRunner.query(`DROP INDEX "IDX_permission_name"`);

    // Drop column
    await queryRunner.query(`ALTER TABLE "user_organizations" DROP COLUMN "roleId"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}