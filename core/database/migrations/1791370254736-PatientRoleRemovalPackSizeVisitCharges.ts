import { MigrationInterface, QueryRunner } from "typeorm";

export class PatientRoleRemovalPackSizeVisitCharges1791370254736 implements MigrationInterface {
    name = 'PatientRoleRemovalPackSizeVisitCharges1791370254736'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The patient role is being removed from the enum, so such users cannot be kept.
        await queryRunner.query(`DELETE FROM "users" WHERE "role"::text = 'patient'`);
        await queryRunner.query(`CREATE TYPE "public"."visit_charges_source_enum" AS ENUM('consultation', 'lab', 'service', 'pharmacy', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."visit_charges_status_enum" AS ENUM('pending', 'paid', 'waived')`);
        await queryRunner.query(`CREATE TABLE "visit_charges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "visitId" uuid NOT NULL, "source" "public"."visit_charges_source_enum" NOT NULL, "referenceId" uuid, "description" character varying(200) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unitPrice" integer NOT NULL, "amount" integer NOT NULL, "status" "public"."visit_charges_status_enum" NOT NULL DEFAULT 'pending', "addedById" uuid, CONSTRAINT "PK_b0e0c0aa5d54b3ec81cb854323b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_12b3e8551b0ed7302c952583be" ON "visit_charges"  ("visitId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c5a526597034237279b787e395" ON "visit_charges"  ("referenceId") `);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD "packSize" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_items_packunit_enum" AS ENUM('PCS', 'BOX', 'PACK', 'CARTON', 'ROLL', 'PAIR', 'SET', 'KG', 'LITRE', 'OTHER')`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD "packUnit" "public"."inventory_items_packunit_enum" NOT NULL DEFAULT 'BOX'`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'receptionist', 'accountant')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."users_department_enum" ADD VALUE 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."users_department_enum" ADD VALUE 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."queue_entries_department_enum" ADD VALUE 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."queue_entries_department_enum" ADD VALUE 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."triages_referredtodepartment_enum" ADD VALUE 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."triages_referredtodepartment_enum" ADD VALUE 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."consultations_department_enum" ADD VALUE 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."consultations_department_enum" ADD VALUE 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."inventory_stores_department_enum" ADD VALUE 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."inventory_stores_department_enum" ADD VALUE 'antenatal'`);
        await queryRunner.query(`ALTER TABLE "visit_charges" ADD CONSTRAINT "FK_12b3e8551b0ed7302c952583be0" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "visit_charges" ADD CONSTRAINT "FK_4400801ec6cc478cb6c4a51bf84" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visit_charges" DROP CONSTRAINT "FK_4400801ec6cc478cb6c4a51bf84"`);
        await queryRunner.query(`ALTER TABLE "visit_charges" DROP CONSTRAINT "FK_12b3e8551b0ed7302c952583be0"`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_stores_department_enum_old" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'main_pharmacy', 'finance', 'administrator')`);
        await queryRunner.query(`ALTER TABLE "inventory_stores" ALTER COLUMN "department" TYPE "public"."inventory_stores_department_enum_old" USING "department"::"text"::"public"."inventory_stores_department_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_stores_department_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."inventory_stores_department_enum_old" RENAME TO "inventory_stores_department_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."consultations_department_enum_old" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'main_pharmacy', 'finance', 'administrator')`);
        await queryRunner.query(`ALTER TABLE "consultations" ALTER COLUMN "department" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "consultations" ALTER COLUMN "department" TYPE "public"."consultations_department_enum_old" USING "department"::"text"::"public"."consultations_department_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."consultations_department_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."consultations_department_enum_old" RENAME TO "consultations_department_enum"`);
        await queryRunner.query(`ALTER TABLE "consultations" ALTER COLUMN "department" SET DEFAULT 'outpatient_clinic'`);
        await queryRunner.query(`CREATE TYPE "public"."triages_referredtodepartment_enum_old" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'main_pharmacy', 'finance', 'administrator')`);
        await queryRunner.query(`ALTER TABLE "triages" ALTER COLUMN "referredToDepartment" TYPE "public"."triages_referredtodepartment_enum_old" USING "referredToDepartment"::"text"::"public"."triages_referredtodepartment_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."triages_referredtodepartment_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."triages_referredtodepartment_enum_old" RENAME TO "triages_referredtodepartment_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."queue_entries_department_enum_old" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'main_pharmacy', 'finance', 'administrator')`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ALTER COLUMN "department" TYPE "public"."queue_entries_department_enum_old" USING "department"::"text"::"public"."queue_entries_department_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."queue_entries_department_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."queue_entries_department_enum_old" RENAME TO "queue_entries_department_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."users_department_enum_old" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'main_pharmacy', 'finance', 'administrator')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "department" TYPE "public"."users_department_enum_old" USING "department"::"text"::"public"."users_department_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_department_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_department_enum_old" RENAME TO "users_department_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('super_admin', 'admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'receptionist', 'accountant', 'patient')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'patient'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "packUnit"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_items_packunit_enum"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "packSize"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5a526597034237279b787e395"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12b3e8551b0ed7302c952583be"`);
        await queryRunner.query(`DROP TABLE "visit_charges"`);
        await queryRunner.query(`DROP TYPE "public"."visit_charges_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."visit_charges_source_enum"`);
    }

}
