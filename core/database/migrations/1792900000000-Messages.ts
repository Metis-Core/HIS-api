import { MigrationInterface, QueryRunner } from 'typeorm';

export class Messages1792900000000 implements MigrationInterface {
  name = 'Messages1792900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "senderId" uuid NOT NULL, "recipientId" uuid NOT NULL, "body" text NOT NULL, "visitId" uuid, "readAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_461f7155bd2bed0ae06d89a69f" ON "messages"  ("senderId", "recipientId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7852d83602571d9aa849e1c7e6" ON "messages"  ("recipientId", "readAt") `,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum" ADD VALUE 'message'`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_f548818d46a1315d4e1d5e62da5" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_aa646f6b3319869f7ada1c7574c" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_aa646f6b3319869f7ada1c7574c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_f548818d46a1315d4e1d5e62da5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(
      `UPDATE "notifications" SET "type" = 'general' WHERE "type" = 'message'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('system', 'lab_result', 'lab_order', 'prescription', 'appointment', 'visit', 'queue', 'inventory', 'general')`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'general'`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7852d83602571d9aa849e1c7e6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_461f7155bd2bed0ae06d89a69f"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
  }
}
