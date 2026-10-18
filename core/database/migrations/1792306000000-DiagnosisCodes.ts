import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiagnosisCodes1792306000000 implements MigrationInterface {
  name = 'DiagnosisCodes1792306000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "diagnosis_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "system" character varying(16) NOT NULL, "code" character varying(16) NOT NULL, "title" character varying(255) NOT NULL, CONSTRAINT "PK_eb0b893cd3586566674519eb789" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_465c809e38fd1aa9531ebded2f" ON "diagnosis_codes"  ("code") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_101cbc577608b8b9f19b809a27" ON "diagnosis_codes"  ("system", "code") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_101cbc577608b8b9f19b809a27"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_465c809e38fd1aa9531ebded2f"`,
    );
    await queryRunner.query(`DROP TABLE "diagnosis_codes"`);
  }
}
