import { MigrationInterface, QueryRunner } from 'typeorm';

export class TeamsAndDischarge1793000000000 implements MigrationInterface {
  name = 'TeamsAndDischarge1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD "dischargedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD "dischargedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD "dischargeNotes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "teamRole" character varying(20)`,
    );
    await queryRunner.query(`ALTER TABLE "messages" ADD "batchId" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_7cc2f42a86b155e78e5ae483cf" ON "admissions"  ("dischargedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2f4c721a91683a19c0d004c292" ON "messages"  ("batchId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" ADD CONSTRAINT "FK_395762cd5d815a28ecf1f46f89f" FOREIGN KEY ("dischargedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP CONSTRAINT "FK_395762cd5d815a28ecf1f46f89f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2f4c721a91683a19c0d004c292"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7cc2f42a86b155e78e5ae483cf"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "batchId"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "teamRole"`);
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP COLUMN "dischargeNotes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP COLUMN "dischargedById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admissions" DROP COLUMN "dischargedAt"`,
    );
  }
}
