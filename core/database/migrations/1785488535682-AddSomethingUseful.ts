import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSomethingUseful1785488535682 implements MigrationInterface {
    name = 'AddSomethingUseful1785488535682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST', 'RECEPTIONIST', 'ACCOUNTANT', 'PATIENT')`);
        await queryRunner.query(`CREATE TYPE "public"."users_department_enum" AS ENUM('RECEPTION', 'TRIAGE', 'OUTPATIENT_CLINIC', 'INPATIENT_WARD', 'MAIN_LABORATORY', 'RADIOLOGY', 'MAIN_PHARMACY', 'FINANCE', 'ADMINISTRATION')`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_RESET')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying NOT NULL, "username" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'PATIENT', "department" "public"."users_department_enum" NOT NULL, "status" "public"."users_status_enum" NOT NULL DEFAULT 'ACTIVE', "passwordLastChangedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('ACCESS', 'REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFICATION')`);
        await queryRunner.query(`CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "type" "public"."auth_tokens_type_enum" NOT NULL, "tokenHash" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "replacedByTokenId" uuid, CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5689ce2d6c4a5634e05eee9be" ON "auth_tokens"  ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_c25fb956ebada4b256501585cc" ON "auth_tokens"  ("userId") `);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_c25fb956ebada4b256501585cca" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_c25fb956ebada4b256501585cca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c25fb956ebada4b256501585cc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5689ce2d6c4a5634e05eee9be"`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."auth_tokens_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_department_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
