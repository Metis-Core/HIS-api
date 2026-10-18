import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabResultVerification1792400100000 implements MigrationInterface {
  name = 'LabResultVerification1792400100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lab_result_amendments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "itemId" uuid NOT NULL, "previousData" jsonb, "previousFlags" jsonb, "previousNotes" text, "newData" jsonb, "newNotes" text, "reason" text NOT NULL, "amendedById" uuid NOT NULL, "previousVerifiedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_10fcc6d7287e577e82c64a17e69" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ed1da9d8aad5d0a0c379c10de6" ON "lab_result_amendments"  ("itemId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD "collectedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD "verifiedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."lab_order_items_status_enum" ADD VALUE 'verified'`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD CONSTRAINT "FK_e8caec2c1863eddbe107fbc18ce" FOREIGN KEY ("collectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD CONSTRAINT "FK_c1bfbb4259029c729f900e70907" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_result_amendments" ADD CONSTRAINT "FK_ed1da9d8aad5d0a0c379c10de6f" FOREIGN KEY ("itemId") REFERENCES "lab_order_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_result_amendments" ADD CONSTRAINT "FK_e3ae3fea26a4117e59b3d389b67" FOREIGN KEY ("amendedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_result_amendments" DROP CONSTRAINT "FK_e3ae3fea26a4117e59b3d389b67"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_result_amendments" DROP CONSTRAINT "FK_ed1da9d8aad5d0a0c379c10de6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP CONSTRAINT "FK_c1bfbb4259029c729f900e70907"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP CONSTRAINT "FK_e8caec2c1863eddbe107fbc18ce"`,
    );
    // Verified results fall back to "result ready"; verifier, timestamps and amendments are dropped.
    await queryRunner.query(
      `UPDATE "lab_order_items" SET "status" = 'result_ready' WHERE "status" = 'verified'`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lab_order_items_status_enum_old" AS ENUM('pending', 'collected', 'in_process', 'result_ready', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ALTER COLUMN "status" TYPE "public"."lab_order_items_status_enum_old" USING "status"::"text"::"public"."lab_order_items_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."lab_order_items_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."lab_order_items_status_enum_old" RENAME TO "lab_order_items_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP COLUMN "verifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP COLUMN "verifiedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP COLUMN "collectedById"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ed1da9d8aad5d0a0c379c10de6"`,
    );
    await queryRunner.query(`DROP TABLE "lab_result_amendments"`);
  }
}
