import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2CreateUuidExtension1699999999998 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the uuid-ossp extension if it doesn't exist
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is typically not dropped as it may be used by other parts of the system
    // But for completeness, we can include the drop command
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
} 