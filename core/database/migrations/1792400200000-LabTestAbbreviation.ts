import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabTestAbbreviation1792400200000 implements MigrationInterface {
  name = 'LabTestAbbreviation1792400200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_tests" ADD "abbreviation" character varying(64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_tests" DROP COLUMN "abbreviation"`,
    );
  }
}
