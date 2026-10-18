import { MigrationInterface, QueryRunner } from 'typeorm';

type LegacyField = Record<string, unknown> & {
  referenceRange?: string;
  helpText?: string;
};
type Schema = { fields: LegacyField[] } | null;
type LegacyTest = {
  id: string;
  referenceRange: string | null;
  unit: string | null;
  resultSchema: Schema;
};

const RANGE = /^\s*(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)\s*$/i;

// Free-text ranges like "4.0 - 11.0" become numeric intervals; anything else is kept as help text.
function convertField(field: LegacyField): LegacyField {
  const { referenceRange, ...rest } = field;
  if (!referenceRange) return rest;
  const match = RANGE.exec(referenceRange);
  if (match)
    return {
      ...rest,
      ranges: [{ low: Number(match[1]), high: Number(match[2]) }],
    };
  const note = `Reference: ${referenceRange}`;
  return {
    ...rest,
    helpText: rest.helpText ? `${rest.helpText} (${note})` : note,
  };
}

function convertSchema(
  schema: Schema,
  referenceRange: string | null,
  unit: string | null,
): Schema {
  if (schema?.fields?.length)
    return { ...schema, fields: schema.fields.map(convertField) };
  if (!referenceRange) return schema;
  const plain: LegacyField = {
    key: 'value',
    label: 'Result',
    type: 'text',
    referenceRange,
  };
  return { fields: [convertField(unit ? { ...plain, unit } : plain)] };
}

export class LabStructuredResults1792400000000 implements MigrationInterface {
  name = 'LabStructuredResults1792400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD "resultData" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD "resultFlags" jsonb`,
    );
    if (await queryRunner.hasTable('lab_result_data_rollback')) {
      await queryRunner.query(
        `UPDATE "lab_order_items" i SET "resultData" = r."resultData", "resultFlags" = r."resultFlags" FROM "lab_result_data_rollback" r WHERE r."itemId" = i.id`,
      );
      await queryRunner.query(`DROP TABLE "lab_result_data_rollback"`);
    }
    await queryRunner.query(
      `CREATE TABLE "lab_result_value_backup" ("itemId" uuid PRIMARY KEY, "resultValue" character varying(255) NOT NULL, "convertedData" jsonb NOT NULL)`,
    );
    // JSON object strings become the data as-is; any other text is kept under the single "value" field.
    await queryRunner.query(`DO $$
      DECLARE r record; parsed jsonb;
      BEGIN
        FOR r IN SELECT id, "resultValue" FROM "lab_order_items" WHERE "resultValue" IS NOT NULL AND "resultData" IS NULL LOOP
          BEGIN parsed := r."resultValue"::jsonb; EXCEPTION WHEN others THEN parsed := NULL; END;
          IF parsed IS NULL OR jsonb_typeof(parsed) <> 'object' THEN parsed := jsonb_build_object('value', r."resultValue"); END IF;
          UPDATE "lab_order_items" SET "resultData" = parsed WHERE id = r.id;
          INSERT INTO "lab_result_value_backup" VALUES (r.id, r."resultValue", parsed);
        END LOOP;
      END $$`);
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP COLUMN "resultValue"`,
    );

    await queryRunner.query(
      `CREATE TABLE "lab_test_reference_backup" ("testId" uuid PRIMARY KEY, "referenceRange" character varying(150), "originalSchema" jsonb, "convertedSchema" jsonb)`,
    );
    const tests = (await queryRunner.query(
      `SELECT id, "referenceRange", unit, "resultSchema" FROM "lab_tests" WHERE "referenceRange" IS NOT NULL OR "resultSchema" IS NOT NULL`,
    )) as LegacyTest[];
    for (const test of tests) {
      const converted = convertSchema(
        test.resultSchema,
        test.referenceRange,
        test.unit,
      );
      await queryRunner.query(
        `INSERT INTO "lab_test_reference_backup" VALUES ($1, $2, $3, $4)`,
        [
          test.id,
          test.referenceRange,
          test.resultSchema === null ? null : JSON.stringify(test.resultSchema),
          converted === null ? null : JSON.stringify(converted),
        ],
      );
      await queryRunner.query(
        `UPDATE "lab_tests" SET "resultSchema" = $2 WHERE id = $1`,
        [test.id, converted === null ? null : JSON.stringify(converted)],
      );
    }
    await queryRunner.query(
      `ALTER TABLE "lab_tests" DROP COLUMN "referenceRange"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lab_tests" ADD "referenceRange" character varying(150)`,
    );
    await queryRunner.query(
      `UPDATE "lab_tests" t SET "referenceRange" = b."referenceRange" FROM "lab_test_reference_backup" b WHERE b."testId" = t.id`,
    );
    // Templates edited since the upgrade keep their edits; untouched ones get their original shape back.
    await queryRunner.query(
      `UPDATE "lab_tests" t SET "resultSchema" = b."originalSchema" FROM "lab_test_reference_backup" b WHERE b."testId" = t.id AND t."resultSchema" IS NOT DISTINCT FROM b."convertedSchema"`,
    );
    await queryRunner.query(`DROP TABLE "lab_test_reference_backup"`);

    // Results entered after the upgrade don't fit varchar(255) losslessly, so a full copy is parked for the next up.
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lab_result_data_rollback" ("itemId" uuid PRIMARY KEY, "resultData" jsonb, "resultFlags" jsonb)`,
    );
    await queryRunner.query(
      `INSERT INTO "lab_result_data_rollback" SELECT i.id, i."resultData", i."resultFlags" FROM "lab_order_items" i LEFT JOIN "lab_result_value_backup" b ON b."itemId" = i.id AND b."convertedData" = i."resultData" WHERE i."resultData" IS NOT NULL AND b."itemId" IS NULL ON CONFLICT ("itemId") DO UPDATE SET "resultData" = EXCLUDED."resultData", "resultFlags" = EXCLUDED."resultFlags"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" ADD "resultValue" character varying(255)`,
    );
    await queryRunner.query(
      `UPDATE "lab_order_items" i SET "resultValue" = CASE WHEN b."itemId" IS NOT NULL THEN b."resultValue" WHEN i."resultData" - 'value' = '{}'::jsonb THEN left(i."resultData"->>'value', 255) ELSE left(i."resultData"::text, 255) END FROM "lab_order_items" i2 LEFT JOIN "lab_result_value_backup" b ON b."itemId" = i2.id AND b."convertedData" = i2."resultData" WHERE i2.id = i.id AND i."resultData" IS NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "lab_result_value_backup"`);
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP COLUMN "resultFlags"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lab_order_items" DROP COLUMN "resultData"`,
    );
  }
}
