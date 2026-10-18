import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsultationLockAndAddenda1792305067901 implements MigrationInterface {
  name = 'ConsultationLockAndAddenda1792305067901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "consultation_addenda" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "consultationId" uuid NOT NULL, "authorId" uuid NOT NULL, "body" text NOT NULL, CONSTRAINT "PK_527519be79a613c1cf9bf805469" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a855aed487dbc71e05fa881725" ON "consultation_addenda"  ("consultationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "completionNotes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "cancellationReason" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultation_addenda" ADD CONSTRAINT "FK_a855aed487dbc71e05fa8817256" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultation_addenda" ADD CONSTRAINT "FK_ce586f34045e945802dd4689b6f" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Fold addenda, hand-off notes and cancel reasons back into notes so a rollback loses no clinical text.
    await queryRunner.query(
      `UPDATE "consultations" c SET "notes" = concat_ws(E'\n\n', c."notes", (SELECT string_agg('Addendum ' || to_char(a."createdAt", 'YYYY-MM-DD HH24:MI') || ': ' || a."body", E'\n\n' ORDER BY a."createdAt") FROM "consultation_addenda" a WHERE a."consultationId" = c."id"), 'Hand-off: ' || c."completionNotes", 'Cancelled: ' || c."cancellationReason") WHERE c."completionNotes" IS NOT NULL OR c."cancellationReason" IS NOT NULL OR EXISTS (SELECT 1 FROM "consultation_addenda" a WHERE a."consultationId" = c."id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultation_addenda" DROP CONSTRAINT "FK_ce586f34045e945802dd4689b6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultation_addenda" DROP CONSTRAINT "FK_a855aed487dbc71e05fa8817256"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP COLUMN "cancellationReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP COLUMN "completionNotes"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a855aed487dbc71e05fa881725"`,
    );
    await queryRunner.query(`DROP TABLE "consultation_addenda"`);
  }
}
