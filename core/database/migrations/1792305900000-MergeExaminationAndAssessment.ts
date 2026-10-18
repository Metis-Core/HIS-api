import { MigrationInterface, QueryRunner } from 'typeorm';

// D2: merge the two fields without losing either; the originals are kept so `down` can restore them exactly.
export class MergeExaminationAndAssessment1792305900000 implements MigrationInterface {
  name = 'MergeExaminationAndAssessment1792305900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "consultation_exam_assessment_backup" ("consultationId" uuid NOT NULL, "examinationFindings" text, "assessment" text, "merged" text, CONSTRAINT "PK_consultation_exam_assessment_backup" PRIMARY KEY ("consultationId"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "examinationAndAssessment" text`,
    );
    await queryRunner.query(
      `UPDATE "consultations" SET "examinationAndAssessment" = NULLIF(concat_ws(E'\\n\\n', NULLIF(btrim("examinationFindings"), ''), NULLIF(btrim("assessment"), '')), '')`,
    );
    await queryRunner.query(
      `INSERT INTO "consultation_exam_assessment_backup" ("consultationId", "examinationFindings", "assessment", "merged") SELECT "id", "examinationFindings", "assessment", "examinationAndAssessment" FROM "consultations" WHERE "examinationFindings" IS NOT NULL OR "assessment" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP COLUMN "examinationFindings"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP COLUMN "assessment"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "assessment" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "examinationFindings" text`,
    );
    // Text written after the merge has no split, so it all goes back into examination findings.
    await queryRunner.query(
      `UPDATE "consultations" SET "examinationFindings" = "examinationAndAssessment"`,
    );
    await queryRunner.query(
      `UPDATE "consultations" c SET "examinationFindings" = b."examinationFindings", "assessment" = b."assessment" FROM "consultation_exam_assessment_backup" b WHERE b."consultationId" = c."id" AND c."examinationAndAssessment" IS NOT DISTINCT FROM b."merged"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP COLUMN "examinationAndAssessment"`,
    );
    await queryRunner.query(`DROP TABLE "consultation_exam_assessment_backup"`);
  }
}
