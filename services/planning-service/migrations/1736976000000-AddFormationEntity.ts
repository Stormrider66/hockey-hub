import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class AddFormationEntity1736976000000 implements MigrationInterface {
  name = 'AddFormationEntity1736976000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create formations table
    await queryRunner.createTable(
      new Table({
        name: 'formations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'organizationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'coachId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'teamId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['offensive', 'defensive', 'transition', 'special_teams'],
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'positions',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'strengths',
            type: 'text',
            isArray: true,
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'weaknesses',
            type: 'text',
            isArray: true,
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'situational_use',
            type: 'text',
            isArray: true,
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'isTemplate',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'usageCount',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'successRate',
            type: 'float',
            default: 0,
            isNullable: false,
          },
          {
            name: 'tags',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'formations',
      new Index('IDX_formations_organizationId_isActive', ['organizationId', 'isActive'])
    );

    await queryRunner.createIndex(
      'formations',
      new Index('IDX_formations_type_isActive', ['type', 'isActive'])
    );

    await queryRunner.createIndex(
      'formations',
      new Index('IDX_formations_name', ['name'])
    );

    await queryRunner.createIndex(
      'formations',
      new Index('IDX_formations_coachId', ['coachId'])
    );

    await queryRunner.createIndex(
      'formations',
      new Index('IDX_formations_teamId', ['teamId'])
    );

    // Add formationId column to tactical_plans table
    await queryRunner.query(`ALTER TABLE "tactical_plans" ADD COLUMN "formationId" uuid`);

    // Create index for formationId
    await queryRunner.createIndex(
      'tactical_plans',
      new Index('IDX_tactical_plans_formationId', ['formationId'])
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'tactical_plans',
      new ForeignKey({
        columnNames: ['formationId'],
        referencedTableName: 'formations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
    );

    // Rename existing formation column to legacyFormation for backward compatibility
    await queryRunner.query(`ALTER TABLE "tactical_plans" RENAME COLUMN "formation" TO "legacyFormation"`);

    // Insert some default formation templates
    await queryRunner.query(`
      INSERT INTO formations (
        name, 
        "organizationId", 
        "coachId", 
        type, 
        description, 
        positions, 
        strengths, 
        weaknesses, 
        situational_use, 
        "isTemplate", 
        "isActive"
      ) VALUES 
      (
        '1-2-2 Offensive',
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
        'offensive',
        'Aggressive offensive formation with high forwards',
        '[
          {"role": "Center", "x": 75, "y": 50, "zone": "offensive"},
          {"role": "Left Wing", "x": 85, "y": 25, "zone": "offensive"},
          {"role": "Right Wing", "x": 85, "y": 75, "zone": "offensive"},
          {"role": "Left Defense", "x": 45, "y": 35, "zone": "neutral"},
          {"role": "Right Defense", "x": 45, "y": 65, "zone": "neutral"}
        ]',
        '{"Offensive pressure", "Scoring chances", "Zone control"}',
        '{"Defensive gaps", "Counterattack vulnerability"}',
        '{"Power play", "Trailing in game", "Offensive zone draws"}',
        true,
        true
      ),
      (
        '1-3-1 Neutral Zone',
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
        'transition',
        'Balanced formation for neutral zone control',
        '[
          {"role": "Center", "x": 60, "y": 50, "zone": "neutral"},
          {"role": "Left Wing", "x": 50, "y": 25, "zone": "neutral"},
          {"role": "Right Wing", "x": 50, "y": 75, "zone": "neutral"},
          {"role": "Left Defense", "x": 30, "y": 35, "zone": "defensive"},
          {"role": "Right Defense", "x": 30, "y": 65, "zone": "defensive"}
        ]',
        '{"Zone control", "Transition play", "Balanced coverage"}',
        '{"Limited offense", "Requires discipline"}',
        '{"Even strength", "Protecting lead", "Neutral zone play"}',
        true,
        true
      ),
      (
        'Defensive Box',
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
        'defensive',
        'Compact defensive formation to protect the goal',
        '[
          {"role": "Center", "x": 40, "y": 50, "zone": "defensive"},
          {"role": "Left Wing", "x": 35, "y": 30, "zone": "defensive"},
          {"role": "Right Wing", "x": 35, "y": 70, "zone": "defensive"},
          {"role": "Left Defense", "x": 20, "y": 35, "zone": "defensive"},
          {"role": "Right Defense", "x": 20, "y": 65, "zone": "defensive"}
        ]',
        '{"Shot blocking", "Defensive coverage", "Goal protection"}',
        '{"Limited offense", "Pressure on defense"}',
        '{"Penalty kill", "Protecting lead", "Defensive zone"}',
        true,
        true
      ),
      (
        'Power Play Umbrella',
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000000',
        'special_teams',
        'Classic umbrella formation for power play situations',
        '[
          {"role": "Quarterback", "x": 50, "y": 15, "zone": "offensive"},
          {"role": "Net Front", "x": 85, "y": 50, "zone": "offensive"},
          {"role": "Flanker", "x": 75, "y": 25, "zone": "offensive"},
          {"role": "Left Point", "x": 25, "y": 25, "zone": "neutral"},
          {"role": "Right Point", "x": 25, "y": 75, "zone": "neutral"}
        ]',
        '{"Puck movement", "Shooting lanes", "Net presence"}',
        '{"Box coverage", "Shot blocking"}',
        '{"Power play", "Man advantage", "5-on-4"}',
        true,
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    const table = await queryRunner.getTable('tactical_plans');
    const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf('formationId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('tactical_plans', foreignKey);
    }

    // Drop index
    await queryRunner.dropIndex('tactical_plans', 'IDX_tactical_plans_formationId');

    // Remove formationId column
    await queryRunner.query(`ALTER TABLE "tactical_plans" DROP COLUMN "formationId"`);

    // Rename legacyFormation back to formation
    await queryRunner.query(`ALTER TABLE "tactical_plans" RENAME COLUMN "legacyFormation" TO "formation"`);

    // Drop formations table
    await queryRunner.dropTable('formations');
  }
}