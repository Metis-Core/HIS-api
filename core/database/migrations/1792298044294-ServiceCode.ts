import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceCode1792298044294 implements MigrationInterface {
  name = 'ServiceCode1792298044294';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD "code" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD CONSTRAINT "UQ_f019a17cb439406ab185382df9b" UNIQUE ("code")`,
    );
    // Backfill: tag the service the old name match would pick, so billing keeps charging the same fee.
    await queryRunner.query(
      `UPDATE "services" SET "code" = 'CONSULTATION' WHERE "id" = (SELECT "id" FROM "services" WHERE "isActive" = true AND "deletedAt" IS NULL AND LOWER("name") LIKE 'consultation%' ORDER BY "name" ASC LIMIT 1)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" DROP CONSTRAINT "UQ_f019a17cb439406ab185382df9b"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "code"`);
  }
}
