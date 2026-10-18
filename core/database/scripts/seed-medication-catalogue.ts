import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { InventoryItemType } from 'src/inventory/enums/inventory-item-type.enum';
import {
  MEDICATION_CATALOGUE,
  SeedMedication,
} from '../seeds/medication-catalogue';
import { buildDataSourceOptions } from '../typeorm.options';

const logger = new Logger('SeedMedicationCatalogue');
const inactive = process.argv.includes('--inactive');

const toRow = (seed: SeedMedication) => ({
  sku: seed.sku,
  name: seed.name,
  type: InventoryItemType.MEDICATION,
  genericName: seed.genericName,
  strength: seed.strength || null,
  dosageForm: seed.dosageForm,
  unitOfMeasure: seed.unitOfMeasure,
  packSize: seed.packSize,
  packUnit: seed.packUnit,
  minStockLevel: seed.minStockLevel,
  unitPrice: seed.unitPrice,
  isControlled: seed.isControlled,
  isActive: !inactive,
});

// Idempotent: an item already on file (same SKU or name) keeps its price, stock levels and status.
async function seed(): Promise<void> {
  const dataSource = await new DataSource(
    buildDataSourceOptions(),
  ).initialize();
  const items = dataSource.getRepository(InventoryItem);
  const counts = { created: 0, existing: 0 };
  try {
    for (const entry of MEDICATION_CATALOGUE) {
      const existing = await items
        .createQueryBuilder('item')
        .withDeleted()
        .where('item.sku = :sku OR LOWER(item.name) = LOWER(:name)', {
          sku: entry.sku,
          name: entry.name,
        })
        .getOne();
      if (existing) {
        counts.existing += 1;
        continue;
      }
      await items.save(items.create(toRow(entry)));
      counts.created += 1;
    }
    logger.log(
      `Medications: ${counts.created} added (${inactive ? 'inactive' : 'active'}), ${counts.existing} already on file. Receive stock into a store before dispensing.`,
    );
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  logger.error((error as Error).message);
  process.exitCode = 1;
});
