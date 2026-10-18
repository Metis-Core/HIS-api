import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProcedureCatalogueAndResults1792700000000 implements MigrationInterface {
  name = 'ProcedureCatalogueAndResults1792700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_a2e85ae84285c1e0b23353d5b44"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."procedure_tests_kind_enum" AS ENUM('radiology', 'surgery')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."procedure_tests_category_enum" AS ENUM('xray', 'ultrasound', 'ecg', 'echo', 'ct', 'mri', 'minor_procedure', 'minor_surgery', 'major_surgery', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "procedure_tests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "code" character varying(32) NOT NULL, "abbreviation" character varying(64), "name" character varying(150) NOT NULL, "description" character varying(500), "kind" "public"."procedure_tests_kind_enum" NOT NULL, "category" "public"."procedure_tests_category_enum" NOT NULL DEFAULT 'other', "price" integer NOT NULL DEFAULT '0', "durationMinutes" integer, "preparation" character varying(500), "resultSchema" jsonb, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_a49a7832729b4b5f1bb2342f2d2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2c764cbbee203efe98d0321e54" ON "procedure_tests"  ("code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b23dacfb75574468cb8d61954" ON "procedure_tests"  ("kind") `,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP COLUMN "serviceId"`,
    );
    await queryRunner.query(`ALTER TABLE "procedure_orders" ADD "testId" uuid`);
    await queryRunner.query(
      `INSERT INTO "procedure_tests" ("code", "name", "kind", "category", "price", "isActive")
       SELECT 'LEGACY-' || UPPER("kind"::text), 'Earlier order (' || "kind"::text || ')', "kind"::text::"public"."procedure_tests_kind_enum", 'other', 0, false
       FROM (SELECT DISTINCT "kind" FROM "procedure_orders") AS used`,
    );
    await queryRunner.query(
      `UPDATE "procedure_orders" AS o SET "testId" = t."id" FROM "procedure_tests" AS t WHERE t."code" = 'LEGACY-' || UPPER(o."kind"::text)`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ALTER COLUMN "testId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD "resultData" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD "resultFlags" jsonb`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."procedure_orders_classification_enum" AS ENUM('normal', 'abnormal', 'critical')`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD "classification" "public"."procedure_orders_classification_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD "impression" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_bc63f16fb15c9b895eff7f37810" FOREIGN KEY ("testId") REFERENCES "procedure_tests"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_bc63f16fb15c9b895eff7f37810"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP COLUMN "impression"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP COLUMN "classification"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."procedure_orders_classification_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP COLUMN "resultFlags"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP COLUMN "resultData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP COLUMN "testId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD "serviceId" uuid`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b23dacfb75574468cb8d61954"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c764cbbee203efe98d0321e54"`,
    );
    await queryRunner.query(`DROP TABLE "procedure_tests"`);
    await queryRunner.query(
      `DROP TYPE "public"."procedure_tests_category_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."procedure_tests_kind_enum"`);
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_a2e85ae84285c1e0b23353d5b44" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
