import { MigrationInterface, QueryRunner } from 'typeorm';

export class DoctorAvailabilityAndAssignment1792500000000 implements MigrationInterface {
  name = 'DoctorAvailabilityAndAssignment1792500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."availability_periods_status_enum" AS ENUM('available', 'busy', 'on_leave', 'out_of_office')`,
    );
    await queryRunner.query(
      `CREATE TABLE "availability_periods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "userId" uuid NOT NULL, "status" "public"."availability_periods_status_enum" NOT NULL, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE, "note" character varying(255), "createdById" uuid, CONSTRAINT "PK_26029038f6c60ed1508add58125" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc18a1e5eaffed7cf370189620" ON "availability_periods"  ("userId", "startsAt") `,
    );
    await queryRunner.query(`ALTER TABLE "visits" ADD "assignedDoctorId" uuid`);
    await queryRunner.query(`ALTER TABLE "visits" ADD "assignedAt" TIMESTAMP`);
    await queryRunner.query(
      `CREATE TYPE "public"."visits_assignmentsource_enum" AS ENUM('auto', 'manual', 'claimed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD "assignmentSource" "public"."visits_assignmentsource_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f3b0412b8370b23e424e5faab" ON "visits"  ("assignedDoctorId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_1f3b0412b8370b23e424e5faab3" FOREIGN KEY ("assignedDoctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_periods" ADD CONSTRAINT "FK_65bf02e9dff5e92a0e01981fd63" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_periods" ADD CONSTRAINT "FK_dc82e1fc1498841485079e18fae" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "availability_periods" DROP CONSTRAINT "FK_dc82e1fc1498841485079e18fae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_periods" DROP CONSTRAINT "FK_65bf02e9dff5e92a0e01981fd63"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_1f3b0412b8370b23e424e5faab3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f3b0412b8370b23e424e5faab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP COLUMN "assignmentSource"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."visits_assignmentsource_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "visits" DROP COLUMN "assignedAt"`);
    await queryRunner.query(
      `ALTER TABLE "visits" DROP COLUMN "assignedDoctorId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fc18a1e5eaffed7cf370189620"`,
    );
    await queryRunner.query(`DROP TABLE "availability_periods"`);
    await queryRunner.query(
      `DROP TYPE "public"."availability_periods_status_enum"`,
    );
  }
}
