import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTriages1785495968034 implements MigrationInterface {
    name = 'CreateTriages1785495968034'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."patients_gender_enum" AS ENUM('MALE', 'FEMALE', 'OTHER', 'UNKNOWN')`);
        await queryRunner.query(`CREATE TYPE "public"."patients_bloodtype_enum" AS ENUM('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN')`);
        await queryRunner.query(`CREATE TYPE "public"."patients_maritalstatus_enum" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'UNKNOWN')`);
        await queryRunner.query(`CREATE TYPE "public"."patients_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'DECEASED', 'MERGED')`);
        await queryRunner.query(`CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "mrn" character varying(32) NOT NULL, "firstName" character varying(100) NOT NULL, "middleName" character varying(100), "lastName" character varying(100) NOT NULL, "dateOfBirth" date NOT NULL, "gender" "public"."patients_gender_enum" NOT NULL DEFAULT 'UNKNOWN', "bloodType" "public"."patients_bloodtype_enum" NOT NULL DEFAULT 'UNKNOWN', "maritalStatus" "public"."patients_maritalstatus_enum" NOT NULL DEFAULT 'UNKNOWN', "status" "public"."patients_status_enum" NOT NULL DEFAULT 'ACTIVE', "phone" character varying(30), "email" character varying(255), "nationalId" character varying(64), "addressLine1" character varying(255), "addressLine2" character varying(255), "city" character varying(100), "district" character varying(100), "country" character varying(100), "emergencyContactName" character varying(100), "emergencyContactPhone" character varying(30), "emergencyContactRelation" character varying(50), "allergies" text, "notes" text, "userId" uuid, CONSTRAINT "REL_2c24c3490a26d04b0d70f92057" UNIQUE ("userId"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2fe90c44da84b034e30bdadb9d" ON "patients"  ("mrn") `);
        await queryRunner.query(`CREATE INDEX "IDX_8e8e6b29f954d02d0cf410dbaf" ON "patients"  ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_64e2031265399f5690b0beba6a" ON "patients"  ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_72f988d95dd120683ae131c08a" ON "patients"  ("nationalId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2c24c3490a26d04b0d70f92057" ON "patients"  ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."triages_acuity_enum" AS ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5')`);
        await queryRunner.query(`CREATE TYPE "public"."triages_status_enum" AS ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED', 'REFERRED', 'LEFT_WITHOUT_BEING_SEEN', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."triages_consciousness_enum" AS ENUM('ALERT', 'VOICE', 'PAIN', 'UNRESPONSIVE', 'UNKNOWN')`);
        await queryRunner.query(`CREATE TYPE "public"."triages_referredtodepartment_enum" AS ENUM('RECEPTION', 'TRIAGE', 'OUTPATIENT_CLINIC', 'INPATIENT_WARD', 'MAIN_LABORATORY', 'RADIOLOGY', 'MAIN_PHARMACY', 'FINANCE', 'ADMINISTRATION')`);
        await queryRunner.query(`CREATE TABLE "triages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "patientId" uuid NOT NULL, "triagedById" uuid NOT NULL, "acuity" "public"."triages_acuity_enum" NOT NULL, "status" "public"."triages_status_enum" NOT NULL DEFAULT 'WAITING', "chiefComplaint" character varying(500) NOT NULL, "assessmentNotes" text, "consciousness" "public"."triages_consciousness_enum" NOT NULL DEFAULT 'UNKNOWN', "temperatureC" numeric(4,1), "heartRate" integer, "respiratoryRate" integer, "bloodPressureSystolic" integer, "bloodPressureDiastolic" integer, "oxygenSaturation" numeric(5,2), "weightKg" numeric(6,2), "heightCm" numeric(5,2), "painScore" integer, "allergiesNoted" text, "referredToDepartment" "public"."triages_referredtodepartment_enum", "arrivedAt" TIMESTAMP NOT NULL, "triagedAt" TIMESTAMP, "completedAt" TIMESTAMP, "queueNumber" character varying(32), CONSTRAINT "PK_9d9bf41142b9f10d656877220bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b1972cfe8377d31ae1fda3a5dd" ON "triages"  ("patientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_647e5c5d3a1cb8c04a7e022993" ON "triages"  ("triagedById") `);
        await queryRunner.query(`CREATE INDEX "IDX_4f69db7033eb360a0098a5f9e5" ON "triages"  ("acuity") `);
        await queryRunner.query(`CREATE INDEX "IDX_27062480cfd21e70e5bd74df2d" ON "triages"  ("status") `);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "triages" ADD CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "triages" ADD CONSTRAINT "FK_647e5c5d3a1cb8c04a7e0229931" FOREIGN KEY ("triagedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "triages" DROP CONSTRAINT "FK_647e5c5d3a1cb8c04a7e0229931"`);
        await queryRunner.query(`ALTER TABLE "triages" DROP CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27062480cfd21e70e5bd74df2d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f69db7033eb360a0098a5f9e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_647e5c5d3a1cb8c04a7e022993"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b1972cfe8377d31ae1fda3a5dd"`);
        await queryRunner.query(`DROP TABLE "triages"`);
        await queryRunner.query(`DROP TYPE "public"."triages_referredtodepartment_enum"`);
        await queryRunner.query(`DROP TYPE "public"."triages_consciousness_enum"`);
        await queryRunner.query(`DROP TYPE "public"."triages_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."triages_acuity_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c24c3490a26d04b0d70f92057"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72f988d95dd120683ae131c08a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_64e2031265399f5690b0beba6a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e8e6b29f954d02d0cf410dbaf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fe90c44da84b034e30bdadb9d"`);
        await queryRunner.query(`DROP TABLE "patients"`);
        await queryRunner.query(`DROP TYPE "public"."patients_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."patients_maritalstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."patients_bloodtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."patients_gender_enum"`);
    }

}
