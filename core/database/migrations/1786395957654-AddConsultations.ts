import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConsultations1786395957654 implements MigrationInterface {
    name = 'AddConsultations1786395957654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."consultations_type_enum" AS ENUM('OUTPATIENT', 'FOLLOW_UP', 'EMERGENCY', 'INPATIENT_ROUND', 'TELEMEDICINE')`);
        await queryRunner.query(`CREATE TYPE "public"."consultations_status_enum" AS ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."consultations_department_enum" AS ENUM('RECEPTION', 'TRIAGE', 'OUTPATIENT_CLINIC', 'INPATIENT_WARD', 'MAIN_LABORATORY', 'RADIOLOGY', 'MAIN_PHARMACY', 'FINANCE', 'ADMINISTRATION')`);
        await queryRunner.query(`CREATE TABLE "consultations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid NOT NULL, "doctorId" uuid NOT NULL, "visitId" uuid, "triageId" uuid, "type" "public"."consultations_type_enum" NOT NULL DEFAULT 'OUTPATIENT', "status" "public"."consultations_status_enum" NOT NULL DEFAULT 'IN_PROGRESS', "department" "public"."consultations_department_enum" NOT NULL DEFAULT 'OUTPATIENT_CLINIC', "chiefComplaint" character varying(500) NOT NULL, "historyOfPresentIllness" text, "examinationFindings" text, "assessment" text, "diagnosis" text, "icd10Codes" character varying(500), "plan" text, "notes" text, "followUpDate" date, "startedAt" TIMESTAMP NOT NULL, "completedAt" TIMESTAMP, CONSTRAINT "PK_c5b78e9424d9bc68464f6a12103" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a00f58f9b1e75d30d66ee4097d" ON "consultations"  ("patientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9dc2a125f0cf9cacd9f908ba2a" ON "consultations"  ("doctorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5128ebb476306ba7db134101d" ON "consultations"  ("visitId") `);
        await queryRunner.query(`CREATE INDEX "IDX_324d5dcae362ddfbcfe8de4844" ON "consultations"  ("triageId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d206b5c8e97b0fd9ca2ed3432c" ON "consultations"  ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_e75c735da4edfcec042902c751" ON "consultations"  ("status") `);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_9dc2a125f0cf9cacd9f908ba2a8" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_a5128ebb476306ba7db134101d5" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD CONSTRAINT "FK_324d5dcae362ddfbcfe8de4844b" FOREIGN KEY ("triageId") REFERENCES "triages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_324d5dcae362ddfbcfe8de4844b"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_a5128ebb476306ba7db134101d5"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_9dc2a125f0cf9cacd9f908ba2a8"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e75c735da4edfcec042902c751"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d206b5c8e97b0fd9ca2ed3432c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_324d5dcae362ddfbcfe8de4844"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5128ebb476306ba7db134101d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9dc2a125f0cf9cacd9f908ba2a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a00f58f9b1e75d30d66ee4097d"`);
        await queryRunner.query(`DROP TABLE "consultations"`);
        await queryRunner.query(`DROP TYPE "public"."consultations_department_enum"`);
        await queryRunner.query(`DROP TYPE "public"."consultations_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."consultations_type_enum"`);
    }

}
