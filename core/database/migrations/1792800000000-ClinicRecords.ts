import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClinicRecords1792800000000 implements MigrationInterface {
  name = 'ClinicRecords1792800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."clinic_records_kind_enum" AS ENUM('antenatal_visit', 'delivery', 'postnatal_visit', 'immunization')`,
    );
    await queryRunner.query(
      `CREATE TABLE "clinic_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "patientId" uuid NOT NULL, "visitId" uuid, "kind" "public"."clinic_records_kind_enum" NOT NULL, "data" jsonb NOT NULL, "flags" jsonb, "recordedById" uuid NOT NULL, CONSTRAINT "PK_a91d5750223e4fed0e038811b61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7796d42bdefe8b76c0723e8d74" ON "clinic_records"  ("visitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b336d1034321e3a6683c96e929" ON "clinic_records"  ("kind") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f2308300c26af4fb398a0be25" ON "clinic_records"  ("patientId", "kind") `,
    );
    await queryRunner.query(
      `ALTER TABLE "clinic_records" ADD CONSTRAINT "FK_07be5ff1248ecc2b603fe3fb2d3" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinic_records" ADD CONSTRAINT "FK_7796d42bdefe8b76c0723e8d74b" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinic_records" ADD CONSTRAINT "FK_4fe6de7a018391e17ca2443efd8" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clinic_records" DROP CONSTRAINT "FK_4fe6de7a018391e17ca2443efd8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinic_records" DROP CONSTRAINT "FK_7796d42bdefe8b76c0723e8d74b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clinic_records" DROP CONSTRAINT "FK_07be5ff1248ecc2b603fe3fb2d3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f2308300c26af4fb398a0be25"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b336d1034321e3a6683c96e929"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7796d42bdefe8b76c0723e8d74"`,
    );
    await queryRunner.query(`DROP TABLE "clinic_records"`);
    await queryRunner.query(`DROP TYPE "public"."clinic_records_kind_enum"`);
  }
}
