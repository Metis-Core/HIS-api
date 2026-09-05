import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedicationAndLabResultSchema1789600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Medication-specific columns on inventory items
    await queryRunner.query(`
      ALTER TABLE "inventory_items"
        ADD COLUMN IF NOT EXISTS "strength" varchar(50),
        ADD COLUMN IF NOT EXISTS "dosageForm" varchar(50),
        ADD COLUMN IF NOT EXISTS "genericName" varchar(100),
        ADD COLUMN IF NOT EXISTS "isControlled" boolean NOT NULL DEFAULT false
    `);

    // Batch tracking on inventory transactions (RECEIPTs)
    await queryRunner.query(`
      ALTER TABLE "inventory_transactions"
        ADD COLUMN IF NOT EXISTS "batchNumber" varchar(100),
        ADD COLUMN IF NOT EXISTS "expiryDate" date,
        ADD COLUMN IF NOT EXISTS "manufactureDate" date
    `);

    // Result-form schema on lab tests
    await queryRunner.query(`
      ALTER TABLE "lab_tests"
        ADD COLUMN IF NOT EXISTS "resultSchema" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lab_tests" DROP COLUMN IF EXISTS "resultSchema"`);
    await queryRunner.query(`
      ALTER TABLE "inventory_transactions"
        DROP COLUMN IF EXISTS "batchNumber",
        DROP COLUMN IF EXISTS "expiryDate",
        DROP COLUMN IF EXISTS "manufactureDate"
    `);
    await queryRunner.query(`
      ALTER TABLE "inventory_items"
        DROP COLUMN IF EXISTS "strength",
        DROP COLUMN IF EXISTS "dosageForm",
        DROP COLUMN IF EXISTS "genericName",
        DROP COLUMN IF EXISTS "isControlled"
    `);
  }
}
