import { MigrationInterface, QueryRunner } from 'typeorm';

export class Admissions1792306200000 implements MigrationInterface {
  name = 'Admissions1792306200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "patientId" uuid NOT NULL, "visitId" uuid, "consultationId" uuid, "ward" character varying(100) NOT NULL, "reason" text NOT NULL, "admittedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "admittedById" uuid NOT NULL, CONSTRAINT "PK_6d47682a899dfa0a78ce11fe98a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f9d5de8d7dd020123a3c76f0a2" ON "admissions"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_605af1093d9925a6fc86004ee4" ON "admissions"  ("admittedAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a73b1f370dae8f53cad0bd721d" ON "admissions"  ("visitId") WHERE "visitId" IS NOT NULL AND "deletedAt" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD CONSTRAINT "FK_f9d5de8d7dd020123a3c76f0a2e" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD CONSTRAINT "FK_00698542a5c6fb23208403f59cd" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD CONSTRAINT "FK_2ee236e03954fadb3a0125c8d9b" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD CONSTRAINT "FK_6515e5bb9805a58aa4bba8cdd84" FOREIGN KEY ("admittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP CONSTRAINT "FK_6515e5bb9805a58aa4bba8cdd84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP CONSTRAINT "FK_2ee236e03954fadb3a0125c8d9b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP CONSTRAINT "FK_00698542a5c6fb23208403f59cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP CONSTRAINT "FK_f9d5de8d7dd020123a3c76f0a2e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a73b1f370dae8f53cad0bd721d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_605af1093d9925a6fc86004ee4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9d5de8d7dd020123a3c76f0a2"`,
    );
    await queryRunner.query(`DROP TABLE "admissions"`);
  }
}
