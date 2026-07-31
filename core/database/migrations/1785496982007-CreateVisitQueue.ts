import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVisitQueue1785496982007 implements MigrationInterface {
  name = 'CreateVisitQueue1785496982007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."visits_visittype_enum" AS ENUM('WALK_IN', 'APPOINTMENT', 'EMERGENCY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."visits_status_enum" AS ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."visits_currentdepartment_enum" AS ENUM('RECEPTION', 'TRIAGE', 'OUTPATIENT_CLINIC', 'INPATIENT_WARD', 'MAIN_LABORATORY', 'RADIOLOGY', 'MAIN_PHARMACY', 'FINANCE', 'ADMINISTRATION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid NOT NULL, "tokenNumber" character varying(16) NOT NULL, "serviceDate" date NOT NULL, "visitType" "public"."visits_visittype_enum" NOT NULL DEFAULT 'WALK_IN', "status" "public"."visits_status_enum" NOT NULL DEFAULT 'OPEN', "currentDepartment" "public"."visits_currentdepartment_enum" NOT NULL DEFAULT 'TRIAGE', "priority" integer NOT NULL DEFAULT '5', "triageId" uuid, "checkedInById" uuid NOT NULL, "checkedInAt" TIMESTAMP NOT NULL, "completedAt" TIMESTAMP, CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bfa22b367f591db46d899afd82" ON "visits" ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_490e1b3108fe149a4eb59356bc" ON "visits" ("tokenNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b8126a0917fcddb0055edb0fb" ON "visits" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0acbb82019b28e644a6bbf96c7" ON "visits" ("currentDepartment") `,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."queue_entries_department_enum" AS ENUM('RECEPTION', 'TRIAGE', 'OUTPATIENT_CLINIC', 'INPATIENT_WARD', 'MAIN_LABORATORY', 'RADIOLOGY', 'MAIN_PHARMACY', 'FINANCE', 'ADMINISTRATION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."queue_entries_status_enum" AS ENUM('WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'SKIPPED', 'TRANSFERRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "queue_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "visitId" uuid NOT NULL, "department" "public"."queue_entries_department_enum" NOT NULL, "status" "public"."queue_entries_status_enum" NOT NULL DEFAULT 'WAITING', "priority" integer NOT NULL, "sequenceNumber" integer NOT NULL, "servedById" uuid, "calledAt" TIMESTAMP, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "notes" text, CONSTRAINT "PK_8e533b14d1153fecfad7767bda5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5508d527f733a3465c63fcd15e" ON "queue_entries" ("visitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4c4632a21f282df0f86698c25" ON "queue_entries" ("department") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c651e51bd618ac26b7a8fefe4" ON "queue_entries" ("status") `,
    );

    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_bfa22b367f591db46d899afd829" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_51b0c535dfa5c2d7789c5c6bc9d" FOREIGN KEY ("checkedInById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_7991a9a36d0c39c15164868f512" FOREIGN KEY ("triageId") REFERENCES "triages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" ADD CONSTRAINT "FK_5508d527f733a3465c63fcd15e8" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" ADD CONSTRAINT "FK_a3a50a4b5e61a82f18e1a809e18" FOREIGN KEY ("servedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "queue_entries" DROP CONSTRAINT "FK_a3a50a4b5e61a82f18e1a809e18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" DROP CONSTRAINT "FK_5508d527f733a3465c63fcd15e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_7991a9a36d0c39c15164868f512"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_51b0c535dfa5c2d7789c5c6bc9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_bfa22b367f591db46d899afd829"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c651e51bd618ac26b7a8fefe4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e4c4632a21f282df0f86698c25"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5508d527f733a3465c63fcd15e"`,
    );
    await queryRunner.query(`DROP TABLE "queue_entries"`);
    await queryRunner.query(`DROP TYPE "public"."queue_entries_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."queue_entries_department_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0acbb82019b28e644a6bbf96c7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b8126a0917fcddb0055edb0fb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_490e1b3108fe149a4eb59356bc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bfa22b367f591db46d899afd82"`,
    );
    await queryRunner.query(`DROP TABLE "visits"`);
    await queryRunner.query(`DROP TYPE "public"."visits_currentdepartment_enum"`);
    await queryRunner.query(`DROP TYPE "public"."visits_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."visits_visittype_enum"`);
  }
}
