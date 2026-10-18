import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProcedureOrdersInvoicesPayments1792600000000 implements MigrationInterface {
  name = 'ProcedureOrdersInvoicesPayments1792600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."procedure_orders_kind_enum" AS ENUM('radiology', 'surgery')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."procedure_orders_priority_enum" AS ENUM('routine', 'urgent', 'emergency')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."procedure_orders_status_enum" AS ENUM('requested', 'scheduled', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "procedure_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "patientId" uuid NOT NULL, "visitId" uuid, "consultationId" uuid, "orderedById" uuid NOT NULL, "kind" "public"."procedure_orders_kind_enum" NOT NULL, "name" character varying(200) NOT NULL, "serviceId" uuid, "priority" "public"."procedure_orders_priority_enum" NOT NULL DEFAULT 'routine', "status" "public"."procedure_orders_status_enum" NOT NULL DEFAULT 'requested', "indication" text, "scheduledFor" TIMESTAMP WITH TIME ZONE, "report" text, "performedById" uuid, "completedAt" TIMESTAMP WITH TIME ZONE, "cancellationReason" character varying(255), CONSTRAINT "PK_f72cde0c29fd588c0f4e10ee208" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07a60f0c6bcb0a929176196f72" ON "procedure_orders"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fdd23a92043cf2a9eb06227fdf" ON "procedure_orders"  ("visitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3dd038c834d8d1c84879306f71" ON "procedure_orders"  ("kind") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_115244b66033d18364ca1beea5" ON "procedure_orders"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "day_closings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "businessDate" date NOT NULL, "closedById" uuid NOT NULL, "closedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "totals" jsonb NOT NULL, "expectedCash" integer NOT NULL, "countedCash" integer, "variance" integer, "paymentCount" integer NOT NULL, "voidedCount" integer NOT NULL, "notes" character varying(500), CONSTRAINT "PK_7dfabe90d91a9819ae4b25c0c41" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_edf1ddc6747748d502fe50d75e" ON "day_closings"  ("businessDate") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invoices_status_enum" AS ENUM('unpaid', 'partially_paid', 'paid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "number" character varying(32) NOT NULL, "visitId" uuid NOT NULL, "patientId" uuid NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'unpaid', "total" integer NOT NULL DEFAULT '0', "paid" integer NOT NULL DEFAULT '0', "settledAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6b20aa66f2a835a4f2fbde4872" ON "invoices"  ("number") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8b085615ed1d674903fac289c5" ON "invoices"  ("visitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f1f96ee217edce59c605cc938" ON "invoices"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac0f09364e3701d9ed35435288" ON "invoices"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('cash', 'mobile_money', 'card', 'insurance')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('recorded', 'voided')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "receiptNumber" character varying(32) NOT NULL, "invoiceId" uuid NOT NULL, "amount" integer NOT NULL, "method" "public"."payments_method_enum" NOT NULL, "reference" character varying(100), "status" "public"."payments_status_enum" NOT NULL DEFAULT 'recorded', "receivedById" uuid NOT NULL, "receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "businessDate" date NOT NULL, "voidedById" uuid, "voidedAt" TIMESTAMP WITH TIME ZONE, "voidReason" character varying(255), "closingId" uuid, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ccf1990399854743306e7ab852" ON "payments"  ("receiptNumber") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43d19956aeab008b49e0804c14" ON "payments"  ("invoiceId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments"  ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ee6765563013dd3c4e5814a37" ON "payments"  ("businessDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_52031a9697b863cb1b66f9cb23" ON "payments"  ("closingId") `,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."visit_charges_source_enum" ADD VALUE 'radiology'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."visit_charges_source_enum" ADD VALUE 'surgery'`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_07a60f0c6bcb0a929176196f72f" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_fdd23a92043cf2a9eb06227fdf2" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_3f1f1bd87745fe1caff0a519787" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_5a5607c41d597cb46af7e116de5" FOREIGN KEY ("orderedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_a2e85ae84285c1e0b23353d5b44" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" ADD CONSTRAINT "FK_f17c7fdd4165c575cea16f4cb48" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "day_closings" ADD CONSTRAINT "FK_22a45437dfe8d3b5cc755ce564d" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_8b085615ed1d674903fac289c5f" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" ADD CONSTRAINT "FK_7f1f96ee217edce59c605cc9380" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_5b988c4b38ca40d7bdf43a7af97" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_92a31cfeed3703cdd6d5e7dbc8d" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_52031a9697b863cb1b66f9cb235" FOREIGN KEY ("closingId") REFERENCES "day_closings"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_52031a9697b863cb1b66f9cb235"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_92a31cfeed3703cdd6d5e7dbc8d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_5b988c4b38ca40d7bdf43a7af97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_7f1f96ee217edce59c605cc9380"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invoices" DROP CONSTRAINT "FK_8b085615ed1d674903fac289c5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "day_closings" DROP CONSTRAINT "FK_22a45437dfe8d3b5cc755ce564d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_f17c7fdd4165c575cea16f4cb48"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_a2e85ae84285c1e0b23353d5b44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_5a5607c41d597cb46af7e116de5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_3f1f1bd87745fe1caff0a519787"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_fdd23a92043cf2a9eb06227fdf2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedure_orders" DROP CONSTRAINT "FK_07a60f0c6bcb0a929176196f72f"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."visit_charges_source_enum_old" AS ENUM('consultation', 'lab', 'service', 'pharmacy', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" ALTER COLUMN "source" TYPE "public"."visit_charges_source_enum_old" USING "source"::"text"::"public"."visit_charges_source_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."visit_charges_source_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."visit_charges_source_enum_old" RENAME TO "visit_charges_source_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_52031a9697b863cb1b66f9cb23"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ee6765563013dd3c4e5814a37"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43d19956aeab008b49e0804c14"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ccf1990399854743306e7ab852"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac0f09364e3701d9ed35435288"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f1f96ee217edce59c605cc938"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b085615ed1d674903fac289c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b20aa66f2a835a4f2fbde4872"`,
    );
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_edf1ddc6747748d502fe50d75e"`,
    );
    await queryRunner.query(`DROP TABLE "day_closings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_115244b66033d18364ca1beea5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3dd038c834d8d1c84879306f71"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fdd23a92043cf2a9eb06227fdf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_07a60f0c6bcb0a929176196f72"`,
    );
    await queryRunner.query(`DROP TABLE "procedure_orders"`);
    await queryRunner.query(
      `DROP TYPE "public"."procedure_orders_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."procedure_orders_priority_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."procedure_orders_kind_enum"`);
  }
}
