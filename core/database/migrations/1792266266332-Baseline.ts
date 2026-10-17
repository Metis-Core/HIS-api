import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1792266266332 implements MigrationInterface {
  name = 'Baseline1792266266332';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('super_admin', 'admin', 'doctor', 'nurse', 'lab_tech', 'pharmacist', 'receptionist', 'accountant')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_department_enum" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'dental', 'antenatal', 'main_pharmacy', 'finance', 'administrator')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended', 'pending_reset')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "email" character varying NOT NULL, "username" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "department" "public"."users_department_enum" NOT NULL, "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "passwordLastChangedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."auth_tokens_type_enum" AS ENUM('ACCESS', 'REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFICATION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "type" "public"."auth_tokens_type_enum" NOT NULL, "tokenHash" character varying NOT NULL, "userId" uuid NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "replacedByTokenId" uuid, CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5689ce2d6c4a5634e05eee9be" ON "auth_tokens"  ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c25fb956ebada4b256501585cc" ON "auth_tokens"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "name" character varying(100) NOT NULL, "phone" character varying(30) NOT NULL, "relationship" character varying(50), "patientId" uuid NOT NULL, CONSTRAINT "REL_b83cb024deff1ea21fa9a4966b" UNIQUE ("patientId"), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b83cb024deff1ea21fa9a4966b" ON "contacts"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_gender_enum" AS ENUM('male', 'female', 'other', 'unknown')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_bloodtype_enum" AS ENUM('a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-', 'unknown')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_maritalstatus_enum" AS ENUM('single', 'married', 'divorced', 'widowed', 'seperated', 'unknown')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_status_enum" AS ENUM('active', 'inactive', 'deceased', 'merged')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."patients_type_enum" AS ENUM('outpatient', 'inpatient')`,
    );
    await queryRunner.query(
      `CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "mrn" character varying(32) NOT NULL, "firstName" character varying(100) NOT NULL, "middleName" character varying(100), "lastName" character varying(100) NOT NULL, "dateOfBirth" date NOT NULL, "gender" "public"."patients_gender_enum" NOT NULL DEFAULT 'unknown', "bloodType" "public"."patients_bloodtype_enum" NOT NULL DEFAULT 'unknown', "maritalStatus" "public"."patients_maritalstatus_enum" NOT NULL DEFAULT 'unknown', "status" "public"."patients_status_enum" NOT NULL DEFAULT 'active', "type" "public"."patients_type_enum" NOT NULL DEFAULT 'outpatient', "phone" character varying(30), "email" character varying(255), "nationalId" character varying(64), "address" character varying(255), "city" character varying(100), "insuranceProvider" character varying(150), "insurancePolicyNumber" character varying(100), "allergies" text, "notes" text, "userId" uuid, CONSTRAINT "REL_2c24c3490a26d04b0d70f92057" UNIQUE ("userId"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2fe90c44da84b034e30bdadb9d" ON "patients"  ("mrn") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8e8e6b29f954d02d0cf410dbaf" ON "patients"  ("phone") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_64e2031265399f5690b0beba6a" ON "patients"  ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_72f988d95dd120683ae131c08a" ON "patients"  ("nationalId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2c24c3490a26d04b0d70f92057" ON "patients"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."queue_entries_department_enum" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'dental', 'antenatal', 'main_pharmacy', 'finance', 'administrator')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."queue_entries_status_enum" AS ENUM('waiting', 'called', 'in_service', 'completed', 'skipped', 'transfered')`,
    );
    await queryRunner.query(
      `CREATE TABLE "queue_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "visitId" uuid NOT NULL, "department" "public"."queue_entries_department_enum" NOT NULL, "status" "public"."queue_entries_status_enum" NOT NULL DEFAULT 'waiting', "priority" integer NOT NULL, "sequenceNumber" integer NOT NULL, "servedById" uuid, "calledAt" TIMESTAMP, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "notes" text, CONSTRAINT "PK_8e533b14d1153fecfad7767bda5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5508d527f733a3465c63fcd15e" ON "queue_entries"  ("visitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e4c4632a21f282df0f86698c25" ON "queue_entries"  ("department") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c651e51bd618ac26b7a8fefe4" ON "queue_entries"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."visits_visittype_enum" AS ENUM('walk_in', 'appointment', 'emergency')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."visits_status_enum" AS ENUM('open', 'in_progress', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `CREATE TABLE "visits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "patientId" uuid NOT NULL, "visitType" "public"."visits_visittype_enum" NOT NULL DEFAULT 'walk_in', "status" "public"."visits_status_enum" NOT NULL DEFAULT 'open', "checkedInById" uuid NOT NULL, CONSTRAINT "PK_0b0b322289a41015c6ea4e8bf30" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bfa22b367f591db46d899afd82" ON "visits"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b8126a0917fcddb0055edb0fb" ON "visits"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."triages_acuity_enum" AS ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."triages_status_enum" AS ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED', 'REFERRED', 'LEFT_WITHOUT_BEING_SEEN', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."triages_consciousness_enum" AS ENUM('ALERT', 'VOICE', 'PAIN', 'UNRESPONSIVE', 'UNKNOWN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."triages_referredtodepartment_enum" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'dental', 'antenatal', 'main_pharmacy', 'finance', 'administrator')`,
    );
    await queryRunner.query(
      `CREATE TABLE "triages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "patientId" uuid NOT NULL, "triagedById" uuid NOT NULL, "acuity" "public"."triages_acuity_enum" NOT NULL, "status" "public"."triages_status_enum" NOT NULL DEFAULT 'WAITING', "chiefComplaint" character varying(500) NOT NULL, "assessmentNotes" text, "consciousness" "public"."triages_consciousness_enum" NOT NULL DEFAULT 'UNKNOWN', "temperatureC" numeric(4,1), "heartRate" integer, "respiratoryRate" integer, "bloodPressureSystolic" integer, "bloodPressureDiastolic" integer, "oxygenSaturation" numeric(5,2), "weightKg" numeric(6,2), "heightCm" numeric(5,2), "painScore" integer, "allergiesNoted" text, "referredToDepartment" "public"."triages_referredtodepartment_enum", "arrivedAt" TIMESTAMP NOT NULL, "triagedAt" TIMESTAMP, "completedAt" TIMESTAMP, "queueNumber" character varying(32), CONSTRAINT "PK_9d9bf41142b9f10d656877220bf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b1972cfe8377d31ae1fda3a5dd" ON "triages"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_647e5c5d3a1cb8c04a7e022993" ON "triages"  ("triagedById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f69db7033eb360a0098a5f9e5" ON "triages"  ("acuity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27062480cfd21e70e5bd74df2d" ON "triages"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consultations_type_enum" AS ENUM('outpatient', 'follow_up', 'emergency', 'inpatient_round', 'telemedicine')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consultations_status_enum" AS ENUM('in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."consultations_department_enum" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'dental', 'antenatal', 'main_pharmacy', 'finance', 'administrator')`,
    );
    await queryRunner.query(
      `CREATE TABLE "consultations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "patientId" uuid NOT NULL, "doctorId" uuid NOT NULL, "visitId" uuid, "triageId" uuid, "type" "public"."consultations_type_enum" NOT NULL DEFAULT 'outpatient', "status" "public"."consultations_status_enum" NOT NULL DEFAULT 'in_progress', "department" "public"."consultations_department_enum" NOT NULL DEFAULT 'outpatient_clinic', "chiefComplaint" character varying(500) NOT NULL, "historyOfPresentIllness" text, "examinationFindings" text, "assessment" text, "diagnosis" text, "icd10Codes" character varying(500), "plan" text, "notes" text, "followUpDate" date, "startedAt" TIMESTAMP NOT NULL, "completedAt" TIMESTAMP, CONSTRAINT "PK_c5b78e9424d9bc68464f6a12103" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a00f58f9b1e75d30d66ee4097d" ON "consultations"  ("patientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9dc2a125f0cf9cacd9f908ba2a" ON "consultations"  ("doctorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5128ebb476306ba7db134101d" ON "consultations"  ("visitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_324d5dcae362ddfbcfe8de4844" ON "consultations"  ("triageId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d206b5c8e97b0fd9ca2ed3432c" ON "consultations"  ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e75c735da4edfcec042902c751" ON "consultations"  ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_items_type_enum" AS ENUM('medication', 'consumable', 'reagent', 'equipment', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_items_unitofmeasure_enum" AS ENUM('PCS', 'BOX', 'PACK', 'CARTON', 'ROLL', 'PAIR', 'SET', 'KG', 'LITRE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_items_packunit_enum" AS ENUM('PCS', 'BOX', 'PACK', 'CARTON', 'ROLL', 'PAIR', 'SET', 'KG', 'LITRE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "sku" character varying(64) NOT NULL, "name" character varying(150) NOT NULL, "description" text, "type" "public"."inventory_items_type_enum" NOT NULL DEFAULT 'consumable', "unitOfMeasure" "public"."inventory_items_unitofmeasure_enum" NOT NULL DEFAULT 'PCS', "packSize" integer NOT NULL DEFAULT '1', "packUnit" "public"."inventory_items_packunit_enum" NOT NULL DEFAULT 'BOX', "minStockLevel" integer NOT NULL DEFAULT '0', "unitPrice" integer NOT NULL DEFAULT '0', "manufacturer" character varying(100), "strength" character varying(50), "dosageForm" character varying(50), "genericName" character varying(100), "isControlled" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_395ec8d9e0cad6e3890b989fc1" ON "inventory_items"  ("sku") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_stores_type_enum" AS ENUM('GENERAL', 'DEPARTMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_stores_department_enum" AS ENUM('reception', 'triage', 'outpatient_clinic', 'inpatient_ward', 'main_laboratory', 'radiology', 'dental', 'antenatal', 'main_pharmacy', 'finance', 'administrator')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_stores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "name" character varying(100) NOT NULL, "type" "public"."inventory_stores_type_enum" NOT NULL DEFAULT 'GENERAL', "department" "public"."inventory_stores_department_enum", "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_94ed4d5e004b7e0c5a376fd96ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d63922590c9af4ed22351b66a0" ON "inventory_stores"  ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_stock" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "storeId" uuid NOT NULL, "itemId" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '0', "lastRestockedAt" TIMESTAMP, CONSTRAINT "PK_a13d56d2087e6d9eb3d480395bf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_987047a1579af60ce16f0aae4c" ON "inventory_stock"  ("storeId", "itemId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_transactions_type_enum" AS ENUM('RECEIPT', 'ISSUE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'RETURN', 'DISPOSAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "storeId" uuid NOT NULL, "itemId" uuid NOT NULL, "type" "public"."inventory_transactions_type_enum" NOT NULL, "quantity" integer NOT NULL, "runningBalance" integer NOT NULL, "counterpartStoreId" uuid, "referenceType" character varying(100), "referenceId" uuid, "performedById" uuid NOT NULL, "notes" text, "batchNumber" character varying(100), "expiryDate" date, "manufactureDate" date, CONSTRAINT "PK_9b7144851f08f9eededde7edd42" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77c504222900b8c55995423093" ON "inventory_transactions"  ("storeId", "itemId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lab_tests_category_enum" AS ENUM('hematology', 'chemistry', 'microbiology', 'immunology', 'urinalysis', 'parasitology', 'radiology', 'histopathology', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lab_tests_sampletype_enum" AS ENUM('blood', 'urine', 'stool', 'sputum', 'csf', 'tissue', 'swab', 'imaging', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lab_tests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "code" character varying(32) NOT NULL, "name" character varying(150) NOT NULL, "description" character varying(500), "category" "public"."lab_tests_category_enum" NOT NULL DEFAULT 'other', "sampleType" "public"."lab_tests_sampletype_enum" NOT NULL DEFAULT 'blood', "unit" character varying(32), "referenceRange" character varying(150), "price" integer NOT NULL DEFAULT '0', "turnaroundHours" integer, "resultSchema" jsonb, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_400d229da68540bf586c0f4a20f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b7756de508bcd61121c5aa28b5" ON "lab_tests"  ("code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lab_order_items_status_enum" AS ENUM('pending', 'collected', 'in_process', 'result_ready', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lab_order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "orderId" uuid NOT NULL, "testId" uuid NOT NULL, "status" "public"."lab_order_items_status_enum" NOT NULL DEFAULT 'pending', "resultValue" character varying(255), "resultNotes" text, "isAbnormal" boolean NOT NULL DEFAULT false, "resultedById" uuid, "collectedAt" TIMESTAMP, "resultedAt" TIMESTAMP, CONSTRAINT "PK_3447771b48b27a3882eb689b41d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1adfd1e514ddf567fc4dd044e2" ON "lab_order_items"  ("orderId", "testId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lab_orders_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."lab_orders_priority_enum" AS ENUM('routine', 'urgent', 'stat')`,
    );
    await queryRunner.query(
      `CREATE TABLE "lab_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "patientId" uuid NOT NULL, "consultationId" uuid, "visitId" uuid, "orderedById" uuid NOT NULL, "status" "public"."lab_orders_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."lab_orders_priority_enum" NOT NULL DEFAULT 'routine', "clinicalNotes" character varying(500), "completedAt" TIMESTAMP, CONSTRAINT "PK_a488d533e758e6ba02958198f1c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee3d81aa3a690864a5a47e170a" ON "lab_orders"  ("patientId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('system', 'lab_result', 'lab_order', 'prescription', 'appointment', 'visit', 'queue', 'inventory', 'general')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_channel_enum" AS ENUM('in_app', 'email', 'sms')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_priority_enum" AS ENUM('low', 'normal', 'high', 'critical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_status_enum" AS ENUM('unread', 'read', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "userId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'general', "channel" "public"."notifications_channel_enum" NOT NULL DEFAULT 'in_app', "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'normal', "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'unread', "title" character varying(200) NOT NULL, "body" text NOT NULL, "actionUrl" character varying(200), "resourceType" character varying(100), "resourceId" uuid, "readAt" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78207b2dc2b0d717649e89d3fc" ON "notifications"  ("userId", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "one_time_passwords" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "userId" uuid NOT NULL, "verificationToken" character varying NOT NULL, "codeHash" character varying NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP NOT NULL, "verifiedAt" TIMESTAMP, CONSTRAINT "PK_950f90e67e1a84f5c06b622161e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_282074f1ed55e9ba6e8e94b2c0" ON "one_time_passwords"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_99b4c97d8ff563086a80519b1a" ON "one_time_passwords"  ("verificationToken") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."visit_charges_source_enum" AS ENUM('consultation', 'lab', 'service', 'pharmacy', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."visit_charges_status_enum" AS ENUM('pending', 'paid', 'waived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "visit_charges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "visitId" uuid NOT NULL, "source" "public"."visit_charges_source_enum" NOT NULL, "referenceId" uuid, "description" character varying(200) NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unitPrice" integer NOT NULL, "amount" integer NOT NULL, "status" "public"."visit_charges_status_enum" NOT NULL DEFAULT 'pending', "addedById" uuid, CONSTRAINT "PK_b0e0c0aa5d54b3ec81cb854323b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12b3e8551b0ed7302c952583be" ON "visit_charges"  ("visitId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c5a526597034237279b787e395" ON "visit_charges"  ("referenceId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."prescriptions_status_enum" AS ENUM('pending', 'partially_dispensed', 'dispensed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "prescriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "patientId" uuid NOT NULL, "consultationId" uuid, "prescribedById" uuid NOT NULL, "status" "public"."prescriptions_status_enum" NOT NULL DEFAULT 'pending', "notes" text, CONSTRAINT "PK_097b2cc2f2b7e56825468188503" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e949ee06efde0a8de34c39081" ON "prescriptions"  ("patientId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."prescription_items_status_enum" AS ENUM('pending', 'partial', 'dispensed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "prescription_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "prescriptionId" uuid NOT NULL, "itemId" uuid NOT NULL, "dosage" character varying(100) NOT NULL, "frequency" character varying(100) NOT NULL, "duration" character varying(100), "quantity" integer NOT NULL, "dispensedQuantity" integer NOT NULL DEFAULT '0', "status" "public"."prescription_items_status_enum" NOT NULL DEFAULT 'pending', "instructions" text, CONSTRAINT "PK_6216831f49afc381b3934c9672c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dispense_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "dispenseId" uuid NOT NULL, "prescriptionItemId" uuid NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "PK_36f412442ceea88d3523112019a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dispenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "prescriptionId" uuid NOT NULL, "dispensedById" uuid NOT NULL, "storeId" uuid NOT NULL, "notes" text, CONSTRAINT "PK_335c04e2450c6503205c8f7ba3e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "name" character varying(150) NOT NULL, "fee" integer NOT NULL, "description" character varying(255), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_019d74f7abcdcb5a0113010cb03" UNIQUE ("name"), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_c25fb956ebada4b256501585cca" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" ADD CONSTRAINT "FK_b83cb024deff1ea21fa9a4966b9" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" ADD CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" ADD CONSTRAINT "FK_5508d527f733a3465c63fcd15e8" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" ADD CONSTRAINT "FK_a3a50a4b5e61a82f18e1a809e18" FOREIGN KEY ("servedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_bfa22b367f591db46d899afd829" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" ADD CONSTRAINT "FK_51b0c535dfa5c2d7789c5c6bc9d" FOREIGN KEY ("checkedInById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" ADD CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" ADD CONSTRAINT "FK_647e5c5d3a1cb8c04a7e0229931" FOREIGN KEY ("triagedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD CONSTRAINT "FK_9dc2a125f0cf9cacd9f908ba2a8" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD CONSTRAINT "FK_a5128ebb476306ba7db134101d5" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" ADD CONSTRAINT "FK_324d5dcae362ddfbcfe8de4844b" FOREIGN KEY ("triageId") REFERENCES "triages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stock" ADD CONSTRAINT "FK_55d8ae927532ae145362a5419ea" FOREIGN KEY ("storeId") REFERENCES "inventory_stores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stock" ADD CONSTRAINT "FK_c96bbf7243692ed474f2f1e7053" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_8d364f5ea41e31f2522fc32143d" FOREIGN KEY ("storeId") REFERENCES "inventory_stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_d027ed40e39e81b95d21a3e8c98" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_e05025de9088a169361a649b8b4" FOREIGN KEY ("counterpartStoreId") REFERENCES "inventory_stores"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_301376a26ebb63e47651ef6a817" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD CONSTRAINT "FK_337ae120fdb06600788888373ac" FOREIGN KEY ("orderId") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD CONSTRAINT "FK_02e79c2aaba3532c37d6a5e823b" FOREIGN KEY ("testId") REFERENCES "lab_tests"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD CONSTRAINT "FK_6a1e33a7a361d3f8ee40da32495" FOREIGN KEY ("resultedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_d52719e08cd859eb66ccbd4177e" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_50db03f9c9a50315064be2ea1e3" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_48253a6f5093de853cbeb119391" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" ADD CONSTRAINT "FK_1990792a0e01ba9a5ff71026058" FOREIGN KEY ("orderedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "one_time_passwords" ADD CONSTRAINT "FK_282074f1ed55e9ba6e8e94b2c00" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" ADD CONSTRAINT "FK_12b3e8551b0ed7302c952583be0" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" ADD CONSTRAINT "FK_4400801ec6cc478cb6c4a51bf84" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_51f48335657278b20348dde416c" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_29fe8d9d7fd15107817912ff604" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_82376aad120d12ff8b7f19d7b70" FOREIGN KEY ("prescribedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescription_items" ADD CONSTRAINT "FK_8f604306272f41c9be46cca4360" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescription_items" ADD CONSTRAINT "FK_4e265f5ba9de85ff9cf01857619" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispense_items" ADD CONSTRAINT "FK_763e8049d8d745a0b2b3638b2dc" FOREIGN KEY ("dispenseId") REFERENCES "dispenses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispense_items" ADD CONSTRAINT "FK_5906aeccb3fcc44115e290ad9f1" FOREIGN KEY ("prescriptionItemId") REFERENCES "prescription_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispenses" ADD CONSTRAINT "FK_98eaafe81fd0b06dc2d9338055b" FOREIGN KEY ("prescriptionId") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispenses" ADD CONSTRAINT "FK_ef59d4e988dd83c8a45919c3309" FOREIGN KEY ("dispensedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispenses" ADD CONSTRAINT "FK_2554439c889b41a9e2da85e5324" FOREIGN KEY ("storeId") REFERENCES "inventory_stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dispenses" DROP CONSTRAINT "FK_2554439c889b41a9e2da85e5324"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispenses" DROP CONSTRAINT "FK_ef59d4e988dd83c8a45919c3309"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispenses" DROP CONSTRAINT "FK_98eaafe81fd0b06dc2d9338055b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispense_items" DROP CONSTRAINT "FK_5906aeccb3fcc44115e290ad9f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dispense_items" DROP CONSTRAINT "FK_763e8049d8d745a0b2b3638b2dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescription_items" DROP CONSTRAINT "FK_4e265f5ba9de85ff9cf01857619"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescription_items" DROP CONSTRAINT "FK_8f604306272f41c9be46cca4360"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_82376aad120d12ff8b7f19d7b70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_29fe8d9d7fd15107817912ff604"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_51f48335657278b20348dde416c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" DROP CONSTRAINT "FK_4400801ec6cc478cb6c4a51bf84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visit_charges" DROP CONSTRAINT "FK_12b3e8551b0ed7302c952583be0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "one_time_passwords" DROP CONSTRAINT "FK_282074f1ed55e9ba6e8e94b2c00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_1990792a0e01ba9a5ff71026058"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_48253a6f5093de853cbeb119391"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_50db03f9c9a50315064be2ea1e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_orders" DROP CONSTRAINT "FK_d52719e08cd859eb66ccbd4177e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP CONSTRAINT "FK_6a1e33a7a361d3f8ee40da32495"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP CONSTRAINT "FK_02e79c2aaba3532c37d6a5e823b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP CONSTRAINT "FK_337ae120fdb06600788888373ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" DROP CONSTRAINT "FK_301376a26ebb63e47651ef6a817"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" DROP CONSTRAINT "FK_e05025de9088a169361a649b8b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" DROP CONSTRAINT "FK_d027ed40e39e81b95d21a3e8c98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_transactions" DROP CONSTRAINT "FK_8d364f5ea41e31f2522fc32143d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stock" DROP CONSTRAINT "FK_c96bbf7243692ed474f2f1e7053"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_stock" DROP CONSTRAINT "FK_55d8ae927532ae145362a5419ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP CONSTRAINT "FK_324d5dcae362ddfbcfe8de4844b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP CONSTRAINT "FK_a5128ebb476306ba7db134101d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP CONSTRAINT "FK_9dc2a125f0cf9cacd9f908ba2a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "consultations" DROP CONSTRAINT "FK_a00f58f9b1e75d30d66ee4097d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" DROP CONSTRAINT "FK_647e5c5d3a1cb8c04a7e0229931"`,
    );
    await queryRunner.query(
      `ALTER TABLE "triages" DROP CONSTRAINT "FK_b1972cfe8377d31ae1fda3a5dd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_51b0c535dfa5c2d7789c5c6bc9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "visits" DROP CONSTRAINT "FK_bfa22b367f591db46d899afd829"`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" DROP CONSTRAINT "FK_a3a50a4b5e61a82f18e1a809e18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_entries" DROP CONSTRAINT "FK_5508d527f733a3465c63fcd15e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patients" DROP CONSTRAINT "FK_2c24c3490a26d04b0d70f92057a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contacts" DROP CONSTRAINT "FK_b83cb024deff1ea21fa9a4966b9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_c25fb956ebada4b256501585cca"`,
    );
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TABLE "dispenses"`);
    await queryRunner.query(`DROP TABLE "dispense_items"`);
    await queryRunner.query(`DROP TABLE "prescription_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."prescription_items_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e949ee06efde0a8de34c39081"`,
    );
    await queryRunner.query(`DROP TABLE "prescriptions"`);
    await queryRunner.query(`DROP TYPE "public"."prescriptions_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c5a526597034237279b787e395"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12b3e8551b0ed7302c952583be"`,
    );
    await queryRunner.query(`DROP TABLE "visit_charges"`);
    await queryRunner.query(`DROP TYPE "public"."visit_charges_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."visit_charges_source_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99b4c97d8ff563086a80519b1a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_282074f1ed55e9ba6e8e94b2c0"`,
    );
    await queryRunner.query(`DROP TABLE "one_time_passwords"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78207b2dc2b0d717649e89d3fc"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ee3d81aa3a690864a5a47e170a"`,
    );
    await queryRunner.query(`DROP TABLE "lab_orders"`);
    await queryRunner.query(`DROP TYPE "public"."lab_orders_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."lab_orders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1adfd1e514ddf567fc4dd044e2"`,
    );
    await queryRunner.query(`DROP TABLE "lab_order_items"`);
    await queryRunner.query(`DROP TYPE "public"."lab_order_items_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b7756de508bcd61121c5aa28b5"`,
    );
    await queryRunner.query(`DROP TABLE "lab_tests"`);
    await queryRunner.query(`DROP TYPE "public"."lab_tests_sampletype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."lab_tests_category_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_77c504222900b8c55995423093"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_transactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."inventory_transactions_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_987047a1579af60ce16f0aae4c"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_stock"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d63922590c9af4ed22351b66a0"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_stores"`);
    await queryRunner.query(
      `DROP TYPE "public"."inventory_stores_department_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."inventory_stores_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_395ec8d9e0cad6e3890b989fc1"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_items"`);
    await queryRunner.query(
      `DROP TYPE "public"."inventory_items_packunit_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."inventory_items_unitofmeasure_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."inventory_items_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e75c735da4edfcec042902c751"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d206b5c8e97b0fd9ca2ed3432c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_324d5dcae362ddfbcfe8de4844"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5128ebb476306ba7db134101d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9dc2a125f0cf9cacd9f908ba2a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a00f58f9b1e75d30d66ee4097d"`,
    );
    await queryRunner.query(`DROP TABLE "consultations"`);
    await queryRunner.query(
      `DROP TYPE "public"."consultations_department_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."consultations_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."consultations_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_27062480cfd21e70e5bd74df2d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f69db7033eb360a0098a5f9e5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_647e5c5d3a1cb8c04a7e022993"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b1972cfe8377d31ae1fda3a5dd"`,
    );
    await queryRunner.query(`DROP TABLE "triages"`);
    await queryRunner.query(
      `DROP TYPE "public"."triages_referredtodepartment_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."triages_consciousness_enum"`);
    await queryRunner.query(`DROP TYPE "public"."triages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."triages_acuity_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b8126a0917fcddb0055edb0fb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bfa22b367f591db46d899afd82"`,
    );
    await queryRunner.query(`DROP TABLE "visits"`);
    await queryRunner.query(`DROP TYPE "public"."visits_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."visits_visittype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c651e51bd618ac26b7a8fefe4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e4c4632a21f282df0f86698c25"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5508d527f733a3465c63fcd15e"`,
    );
    await queryRunner.query(`DROP TABLE "queue_entries"`);
    await queryRunner.query(`DROP TYPE "public"."queue_entries_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."queue_entries_department_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c24c3490a26d04b0d70f92057"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72f988d95dd120683ae131c08a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_64e2031265399f5690b0beba6a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8e8e6b29f954d02d0cf410dbaf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2fe90c44da84b034e30bdadb9d"`,
    );
    await queryRunner.query(`DROP TABLE "patients"`);
    await queryRunner.query(`DROP TYPE "public"."patients_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."patients_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."patients_maritalstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."patients_bloodtype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."patients_gender_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b83cb024deff1ea21fa9a4966b"`,
    );
    await queryRunner.query(`DROP TABLE "contacts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c25fb956ebada4b256501585cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5689ce2d6c4a5634e05eee9be"`,
    );
    await queryRunner.query(`DROP TABLE "auth_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."auth_tokens_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_department_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
