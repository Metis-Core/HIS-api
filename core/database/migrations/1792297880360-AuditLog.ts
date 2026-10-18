import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLog1792297880360 implements MigrationInterface {
  name = 'AuditLog1792297880360';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('create', 'update', 'soft_delete', 'restore', 'delete')`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "entityType" character varying(64) NOT NULL, "entityId" character varying(64) NOT NULL, "action" "public"."audit_logs_action_enum" NOT NULL, "actorId" uuid, "correlationId" character varying(64), "changes" jsonb, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs"  ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2dc33f7f3c22e2e7badafca1d1" ON "audit_logs"  ("actorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c69efb19bf127c97e6740ad530" ON "audit_logs"  ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13c69424c440a0e765053feb4b" ON "audit_logs"  ("entityType", "entityId") `,
    );
    // Append-only: reject any change to existing audit rows, even from the application's own DB user.
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION audit_logs_reject_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$`,
    );
    await queryRunner.query(
      `CREATE TRIGGER audit_logs_no_update_delete BEFORE UPDATE OR DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION audit_logs_reject_change()`,
    );
    await queryRunner.query(
      `CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON "audit_logs" FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_reject_change()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS audit_logs_no_truncate ON "audit_logs"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS audit_logs_no_update_delete ON "audit_logs"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS audit_logs_reject_change()`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13c69424c440a0e765053feb4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c69efb19bf127c97e6740ad530"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2dc33f7f3c22e2e7badafca1d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
  }
}
