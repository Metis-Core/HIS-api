import { NotFoundException } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { InventoryItemType } from './enums/inventory-item-type.enum';

/** Which items and stores a role may see or move (L3). `null` means no restriction. */
export interface InventoryScope {
  readonly itemTypes: readonly InventoryItemType[] | null;
  readonly departments: readonly Department[] | null;
}

export const FULL_INVENTORY_SCOPE: InventoryScope = {
  itemTypes: null,
  departments: null,
};

export const LAB_INVENTORY_SCOPE: InventoryScope = {
  itemTypes: [InventoryItemType.REAGENT, InventoryItemType.CONSUMABLE],
  departments: [Department.MAIN_LABORATORY],
};

export function inventoryScopeFor(role: UserRole): InventoryScope {
  return role === UserRole.LAB_TECH
    ? LAB_INVENTORY_SCOPE
    : FULL_INVENTORY_SCOPE;
}

export function scopeItems<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  scope: InventoryScope,
): void {
  if (!scope.itemTypes) return;
  qb.andWhere(`${alias}.type IN (:...scopeItemTypes)`, {
    scopeItemTypes: scope.itemTypes,
  });
}

export function scopeStores<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  scope: InventoryScope,
): void {
  if (!scope.departments) return;
  qb.andWhere(`${alias}.department IN (:...scopeDepartments)`, {
    scopeDepartments: scope.departments,
  });
}

// Out-of-scope records answer 404, so their existence is not revealed.
export function assertItemInScope(
  scope: InventoryScope,
  item: { type: InventoryItemType },
): void {
  if (scope.itemTypes && !scope.itemTypes.includes(item.type)) {
    throw new NotFoundException('Inventory item not found');
  }
}

export function assertStoreInScope(
  scope: InventoryScope,
  store: { department: Department | null },
): void {
  if (
    scope.departments &&
    !(store.department && scope.departments.includes(store.department))
  ) {
    throw new NotFoundException('Store not found');
  }
}
