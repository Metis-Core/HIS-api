import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sprint1SoftDeleteAndRestrictFks1792266291255 implements MigrationInterface {
  name = 'Sprint1SoftDeleteAndRestrictFks1792266291255';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_bfa22b367f591db46d899afd829"`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" DROP CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_d52719e08cd859eb66ccbd4177e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" DROP CONSTRAINT "FK_12b3e8551b0ed7302c952583be0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_51f48335657278b20348dde416c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_items" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stores" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stock" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_tests" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "one_time_passwords" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescription_items" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispense_items" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispenses" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD "deletedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_bfa22b367f591db46d899afd829" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" ADD CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_d52719e08cd859eb66ccbd4177e" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" ADD CONSTRAINT "FK_12b3e8551b0ed7302c952583be0" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_51f48335657278b20348dde416c" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_51f48335657278b20348dde416c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" DROP CONSTRAINT "FK_12b3e8551b0ed7302c952583be0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_d52719e08cd859eb66ccbd4177e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" DROP CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_bfa22b367f591db46d899afd829"`,
    );
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "dispenses" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "dispense_items" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescription_items" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "one_time_passwords" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "lab_orders" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "lab_tests" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stock" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stores" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_items" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "triages" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "queue_entries" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" DROP COLUMN "deletedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_51f48335657278b20348dde416c" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" ADD CONSTRAINT "FK_12b3e8551b0ed7302c952583be0" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_d52719e08cd859eb66ccbd4177e" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" ADD CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_bfa22b367f591db46d899afd829" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
