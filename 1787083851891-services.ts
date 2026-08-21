import { MigrationInterface, QueryRunner } from "typeorm";

export class Services1787083851891 implements MigrationInterface {
    name = 'Services1787083851891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "visits" DROP CONSTRAINT "FK_7991a9a36d0c39c15164868f512"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_490e1b3108fe149a4eb59356bc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0acbb82019b28e644a6bbf96c7"`);
        await queryRunner.query(`CREATE TABLE "one_time_passwords" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "userId" uuid NOT NULL, "verificationToken" character varying NOT NULL, "codeHash" character varying NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP NOT NULL, "verifiedAt" TIMESTAMP, CONSTRAINT "PK_950f90e67e1a84f5c06b622161e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_282074f1ed55e9ba6e8e94b2c0" ON "one_time_passwords"  ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_99b4c97d8ff563086a80519b1a" ON "one_time_passwords"  ("verificationToken") `);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "name" character varying(150) NOT NULL, "fee" integer NOT NULL, "description" character varying(255), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_019d74f7abcdcb5a0113010cb03" UNIQUE ("name"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "tokenNumber"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "serviceDate"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "currentDepartment"`);
        await queryRunner.query(`DROP TYPE "public"."visits_currentdepartment_enum"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "priority"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "triageId"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "checkedInAt"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "completedAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "contacts" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "triages" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "consultations" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."queue_entries_status_enum" RENAME TO "queue_entries_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."queue_entries_status_enum" AS ENUM('waiting', 'called', 'in_service', 'completed', 'skipped', 'transfered')`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ALTER COLUMN "status" TYPE "public"."queue_entries_status_enum" USING "status"::"text"::"public"."queue_entries_status_enum"`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ALTER COLUMN "status" SET DEFAULT 'waiting'`);
        await queryRunner.query(`DROP TYPE "public"."queue_entries_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."visits_visittype_enum" RENAME TO "visits_visittype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."visits_visittype_enum" AS ENUM('walk_in', 'appointment', 'emergency')`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "visitType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "visitType" TYPE "public"."visits_visittype_enum" USING "visitType"::"text"::"public"."visits_visittype_enum"`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "visitType" SET DEFAULT 'walk_in'`);
        await queryRunner.query(`DROP TYPE "public"."visits_visittype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."visits_status_enum" RENAME TO "visits_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."visits_status_enum" AS ENUM('open', 'in_progress', 'completed', 'cancelled', 'no_show')`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "status" TYPE "public"."visits_status_enum" USING "status"::"text"::"public"."visits_status_enum"`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "status" SET DEFAULT 'open'`);
        await queryRunner.query(`DROP TYPE "public"."visits_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "one_time_passwords" ADD CONSTRAINT "FK_282074f1ed55e9ba6e8e94b2c00" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "one_time_passwords" DROP CONSTRAINT "FK_282074f1ed55e9ba6e8e94b2c00"`);
        await queryRunner.query(`CREATE TYPE "public"."visits_status_enum_old" AS ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "status" TYPE "public"."visits_status_enum_old" USING "status"::"text"::"public"."visits_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "status" SET DEFAULT 'OPEN'`);
        await queryRunner.query(`DROP TYPE "public"."visits_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."visits_status_enum_old" RENAME TO "visits_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."visits_visittype_enum_old" AS ENUM('WALK_IN', 'APPOINTMENT', 'EMERGENCY')`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "visitType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "visitType" TYPE "public"."visits_visittype_enum_old" USING "visitType"::"text"::"public"."visits_visittype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "visits" ALTER COLUMN "visitType" SET DEFAULT 'WALK_IN'`);
        await queryRunner.query(`DROP TYPE "public"."visits_visittype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."visits_visittype_enum_old" RENAME TO "visits_visittype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."queue_entries_status_enum_old" AS ENUM('WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'SKIPPED', 'TRANSFERRED')`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ALTER COLUMN "status" TYPE "public"."queue_entries_status_enum_old" USING "status"::"text"::"public"."queue_entries_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "queue_entries" ALTER COLUMN "status" SET DEFAULT 'WAITING'`);
        await queryRunner.query(`DROP TYPE "public"."queue_entries_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."queue_entries_status_enum_old" RENAME TO "queue_entries_status_enum"`);
        await queryRunner.query(`ALTER TABLE "consultations" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "triages" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "queue_entries" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "completedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "checkedInAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "triageId" uuid`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "priority" integer NOT NULL DEFAULT '5'`);
        await queryRunner.query(`CREATE TYPE "public"."visits_currentdepartment_enum" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'main_pharmacy', 'finance', 'administrator')`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "currentDepartment" "public"."visits_currentdepartment_enum" NOT NULL DEFAULT 'triage'`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "serviceDate" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "visits" ADD "tokenNumber" character varying(16) NOT NULL`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99b4c97d8ff563086a80519b1a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_282074f1ed55e9ba6e8e94b2c0"`);
        await queryRunner.query(`DROP TABLE "one_time_passwords"`);
        await queryRunner.query(`CREATE INDEX "IDX_0acbb82019b28e644a6bbf96c7" ON "visits" USING btree ("currentDepartment") `);
        await queryRunner.query(`CREATE INDEX "IDX_490e1b3108fe149a4eb59356bc" ON "visits" USING btree ("tokenNumber") `);
        await queryRunner.query(`ALTER TABLE "visits" ADD CONSTRAINT "FK_7991a9a36d0c39c15164868f512" FOREIGN KEY ("triageId") REFERENCES "triages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
