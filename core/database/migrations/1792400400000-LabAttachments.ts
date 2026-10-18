import { MigrationInterface, QueryRunner } from 'typeorm';

export class LabAttachments1792400400000 implements MigrationInterface {
  name = 'LabAttachments1792400400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "lab_attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "itemId" uuid NOT NULL, "fileName" character varying(160) NOT NULL, "mimeType" character varying(100) NOT NULL, "sizeBytes" integer NOT NULL, "sha256" character(64) NOT NULL, "storageKey" character varying(255) NOT NULL, "uploadedById" uuid NOT NULL, CONSTRAINT "UQ_01a363221b6b468a38618a3053d" UNIQUE ("storageKey"), CONSTRAINT "PK_9ca0438ce83469143d955f3f847" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d59d282930c7cb593f1981c57" ON "lab_attachments"  ("itemId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_attachments" ADD CONSTRAINT "FK_0d59d282930c7cb593f1981c57b" FOREIGN KEY ("itemId") REFERENCES "lab_order_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_attachments" ADD CONSTRAINT "FK_1e6e307a535c96520d96f98f304" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_attachments" DROP CONSTRAINT "FK_1e6e307a535c96520d96f98f304"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_attachments" DROP CONSTRAINT "FK_0d59d282930c7cb593f1981c57b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d59d282930c7cb593f1981c57"`,
    );
    await queryRunner.query(`DROP TABLE "lab_attachments"`);
  }
}
