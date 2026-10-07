import { MigrationInterface, QueryRunner } from "typeorm";

// Written to be re-runnable: databases that were previously synchronized may already have these objects.
export class PatientRoleRemovalPackSizeVisitCharges1791340211354 implements MigrationInterface {
    name = 'PatientRoleRemovalPackSizeVisitCharges1791340211354'

    private async createTypeIfMissing(queryRunner: QueryRunner, name: string, labels: string): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."${name}" AS ENUM(${labels}); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    }

    private async addConstraintIfMissing(queryRunner: QueryRunner, table: string, name: string, definition: string): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "${table}" ADD CONSTRAINT "${name}" ${definition}; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // visit_charges
        await this.createTypeIfMissing(queryRunner, 'visit_charges_source_enum', `'consultation', 'lab', 'service', 'pharmacy', 'other'`);
        await this.createTypeIfMissing(queryRunner, 'visit_charges_status_enum', `'pending', 'paid', 'waived'`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "visit_charges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "visitId" uuid NOT NULL, "source" "public"."visit_charges_source_enum" NOT NULL, "referenceId" uuid, "description" character varying(200) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unitPrice" integer NOT NULL, "amount" integer NOT NULL, "status" "public"."visit_charges_status_enum" NOT NULL DEFAULT 'pending', "addedById" uuid, CONSTRAINT "PK_b0e0c0aa5d54b3ec81cb854323b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_12b3e8551b0ed7302c952583be" ON "visit_charges"  ("visitId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_c5a526597034237279b787e395" ON "visit_charges"  ("referenceId") `);
        await this.addConstraintIfMissing(queryRunner, 'visit_charges', 'FK_12b3e8551b0ed7302c952583be0', `FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await this.addConstraintIfMissing(queryRunner, 'visit_charges', 'FK_4400801ec6cc478cb6c4a51bf84', `FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // inventory pack size (reorderLevel is dropped by MergeReorderIntoMinStockLevel)
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "packSize" integer NOT NULL DEFAULT '1'`);
        await this.createTypeIfMissing(queryRunner, 'inventory_items_packunit_enum', `'PCS', 'BOX', 'PACK', 'CARTON', 'ROLL', 'PAIR', 'SET', 'KG', 'LITRE', 'OTHER'`);
        await queryRunner.query(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "packUnit" "public"."inventory_items_packunit_enum" NOT NULL DEFAULT 'BOX'`);

        // patient role removal
        const [{ hasPatient }] = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'users_role_enum' AND e.enumlabel = 'patient') AS "hasPatient"`);
        if (hasPatient) {
            const [{ count }] = await queryRunner.query(`SELECT COUNT(*)::int AS "count" FROM "users" WHERE "role"::text = 'patient'`);
            if (count > 0) {
                throw new Error(`${count} user(s) still have the removed 'patient' role. Reassign or delete them, then re-run this migration.`);
            }
            await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
            await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'receptionist', 'accountant')`);
            await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
            await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        } else {
            await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        }

        // new departments
        await queryRunner.query(`ALTER TYPE "public"."users_department_enum" ADD VALUE IF NOT EXISTS 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."users_department_enum" ADD VALUE IF NOT EXISTS 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."queue_entries_department_enum" ADD VALUE IF NOT EXISTS 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."queue_entries_department_enum" ADD VALUE IF NOT EXISTS 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."triages_referredtodepartment_enum" ADD VALUE IF NOT EXISTS 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."triages_referredtodepartment_enum" ADD VALUE IF NOT EXISTS 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."consultations_department_enum" ADD VALUE IF NOT EXISTS 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."consultations_department_enum" ADD VALUE IF NOT EXISTS 'antenatal'`);
        await queryRunner.query(`ALTER TYPE "public"."inventory_stores_department_enum" ADD VALUE IF NOT EXISTS 'dental'`);
        await queryRunner.query(`ALTER TYPE "public"."inventory_stores_department_enum" ADD VALUE IF NOT EXISTS 'antenatal'`);
    }

    // Department enum values added in up() are left in place: Postgres cannot drop enum labels safely.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'patient'`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "packUnit"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."inventory_items_packunit_enum"`);
        await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "packSize"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "visit_charges"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."visit_charges_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."visit_charges_source_enum"`);
    }

}
