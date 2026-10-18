import { MigrationInterface, QueryRunner } from 'typeorm';

export class VisitTriageCategoryAndPriority1792298500767 implements MigrationInterface {
  name = 'VisitTriageCategoryAndPriority1792298500767';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."visits_triagecategory_enum" AS ENUM('red', 'yellow', 'green')`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD "triageCategory" "public"."visits_triagecategory_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD "emergencyNumber" character varying(32)`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "UQ_3e4b4077da71f0f777c2dd4d574" UNIQUE ("emergencyNumber")`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD "priority" integer NOT NULL DEFAULT '5'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "priority"`);
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "UQ_3e4b4077da71f0f777c2dd4d574"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP COLUMN "emergencyNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP COLUMN "triageCategory"`,
    );
    await queryRunner.query(`DROP TYPE "public"."visits_triagecategory_enum"`);
  }
}
