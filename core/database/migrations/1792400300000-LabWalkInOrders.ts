import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabWalkInOrders1792400300000 implements MigrationInterface {
  name = 'LabWalkInOrders1792400300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD "referringClinician" character varying(150)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD "cancellationReason" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD "cancelledById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_457aa76aa85e13952872888874d" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_457aa76aa85e13952872888874d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP COLUMN "cancelledById"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP COLUMN "cancellationReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP COLUMN "referringClinician"`,
    );
  }
}
