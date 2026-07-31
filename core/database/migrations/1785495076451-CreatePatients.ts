import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePatients1785495076451 implements MigrationInterface {
    name = 'CreatePatients1785495076451'

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
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a"`);
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
