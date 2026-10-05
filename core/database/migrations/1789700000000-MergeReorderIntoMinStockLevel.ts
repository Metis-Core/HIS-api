import { MigrationInterface, QueryRunner } from 'typeorm';

export class MergeReorderIntoMinStockLevel1789700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "inventory_items"
        SET "minStockLevel" = GREATEST("minStockLevel", "reorderLevel")
    `);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "reorderLevel"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inventory_items"
        ADD COLUMN IF NOT EXISTS "reorderLevel" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`UPDATE "inventory_items" SET "reorderLevel" = "minStockLevel"`);
  }
}
