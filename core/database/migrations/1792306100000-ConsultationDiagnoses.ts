import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsultationDiagnoses1792306100000 implements MigrationInterface {
  name = 'ConsultationDiagnoses1792306100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "consultation_diagnoses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "consultationId" uuid NOT NULL, "diagnosisCodeId" uuid, "system" character varying(16) NOT NULL, "code" character varying(16) NOT NULL, "title" character varying(255), "isPrimary" boolean NOT NULL DEFAULT false, "rank" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_613423ff898a7d120e5e6b68813" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e22c7deebce6f3127c8a959fbb" ON "consultation_diagnoses"  ("diagnosisCodeId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f43d16ad64e595202211fd36a9" ON "consultation_diagnoses"  ("consultationId", "system", "code") `,
    );
    // Carry the old CSV codes over in their typed order; codes already in the catalogue are linked now, the rest by the seed.
    await queryRunner.query(
      `INSERT INTO "consultation_diagnoses" ("consultationId", "diagnosisCodeId", "system", "code", "title", "isPrimary", "rank")
       SELECT legacy."consultationId", dc."id", COALESCE(dc."system", 'ICD-10'), legacy."code", dc."title", legacy."rank" = 0, legacy."rank"
       FROM (
         SELECT picked."consultationId", picked."code", (ROW_NUMBER() OVER (PARTITION BY picked."consultationId" ORDER BY picked."position") - 1)::int AS "rank"
         FROM (
           SELECT DISTINCT ON (c."id", UPPER(BTRIM(part.value))) c."id" AS "consultationId", LEFT(UPPER(BTRIM(part.value)), 16) AS "code", part.position
           FROM "consultations" c
           CROSS JOIN LATERAL UNNEST(STRING_TO_ARRAY(c."icd10Codes", ',')) WITH ORDINALITY AS part(value, position)
           WHERE BTRIM(part.value) <> ''
           ORDER BY c."id", UPPER(BTRIM(part.value)), part.position
         ) picked
       ) legacy
       LEFT JOIN "diagnosis_codes" dc ON dc."system" = 'ICD-10-CM' AND dc."code" = legacy."code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP COLUMN "icd10Codes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultation_diagnoses" ADD CONSTRAINT "FK_4a46c6a25928fd6d39bc1d1e398" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultation_diagnoses" ADD CONSTRAINT "FK_e22c7deebce6f3127c8a959fbb6" FOREIGN KEY ("diagnosisCodeId") REFERENCES "diagnosis_codes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "consultation_diagnoses" DROP CONSTRAINT "FK_e22c7deebce6f3127c8a959fbb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultation_diagnoses" DROP CONSTRAINT "FK_4a46c6a25928fd6d39bc1d1e398"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "icd10Codes" character varying(500)`,
    );
    await queryRunner.query(
      `UPDATE "consultations" c SET "icd10Codes" = LEFT(coded."codes", 500) FROM (SELECT "consultationId", STRING_AGG("code", ',' ORDER BY "rank") AS "codes" FROM "consultation_diagnoses" GROUP BY "consultationId") coded WHERE coded."consultationId" = c."id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f43d16ad64e595202211fd36a9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e22c7deebce6f3127c8a959fbb"`,
    );
    await queryRunner.query(`DROP TABLE "consultation_diagnoses"`);
  }
}
