import { UnitOfMeasure } from 'src/inventory/enums/uintMeasure.enum';

export interface SeedMedication {
  sku: string;
  name: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  unitOfMeasure: UnitOfMeasure;
  packSize: number;
  packUnit: UnitOfMeasure;
  minStockLevel: number;
  unitPrice: number;
  isControlled: boolean;
}

interface MedOptions {
  packUnit?: UnitOfMeasure;
  minStock?: number;
  controlled?: boolean;
}

/** Prices are UGX per single tablet, capsule, vial, bottle, tube or sachet; stock is counted in the same unit. */
export const med = (
  sku: string,
  genericName: string,
  strength: string,
  dosageForm: string,
  unitPrice: number,
  packSize: number,
  options: MedOptions = {},
): SeedMedication => ({
  sku: `MED-${sku}`,
  name: [genericName, strength, dosageForm].filter(Boolean).join(' '),
  genericName,
  strength,
  dosageForm,
  unitOfMeasure: UnitOfMeasure.PCS,
  packSize,
  packUnit: options.packUnit ?? UnitOfMeasure.BOX,
  minStockLevel: options.minStock ?? packSize,
  unitPrice,
  isControlled: options.controlled ?? false,
});
