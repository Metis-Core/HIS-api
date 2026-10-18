import { NotFoundException } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Department } from 'common/enums/department.enum';
import { UserRole } from 'common/enums/userRoles.enum';
import { InventoryItemType } from './enums/inventory-item-type.enum';
import {
  assertItemInScope,
  assertStoreInScope,
  FULL_INVENTORY_SCOPE,
  inventoryScopeFor,
  LAB_INVENTORY_SCOPE,
  scopeStores,
} from './inventory-scope.policy';

describe('inventory scope policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [UserRole.LAB_TECH, LAB_INVENTORY_SCOPE],
    [UserRole.PHARMACIST, FULL_INVENTORY_SCOPE],
    [UserRole.ADMIN, FULL_INVENTORY_SCOPE],
  ])('%s gets the expected scope', (role, expected) => {
    // Arrange / Act
    const scope = inventoryScopeFor(role);

    // Assert
    expect(scope).toBe(expected);
  });

  it('lets lab staff see reagents in the lab store but not medicines or the pharmacy', () => {
    // Arrange
    const scope = LAB_INVENTORY_SCOPE;

    // Act
    const reagent = () =>
      assertItemInScope(scope, { type: InventoryItemType.REAGENT });
    const medicine = () =>
      assertItemInScope(scope, { type: InventoryItemType.MEDICATION });
    const lab = () =>
      assertStoreInScope(scope, { department: Department.MAIN_LABORATORY });
    const pharmacy = () =>
      assertStoreInScope(scope, { department: Department.MAIN_PHARMACY });
    const general = () => assertStoreInScope(scope, { department: null });

    // Assert
    expect(reagent).not.toThrow();
    expect(lab).not.toThrow();
    expect(medicine).toThrow(NotFoundException);
    expect(pharmacy).toThrow(NotFoundException);
    expect(general).toThrow(NotFoundException);
  });

  it('adds a store filter only when the scope is limited', () => {
    // Arrange
    const andWhere = jest.fn();
    const qb = { andWhere } as unknown as SelectQueryBuilder<ObjectLiteral>;

    // Act
    scopeStores(qb, 'store', FULL_INVENTORY_SCOPE);
    scopeStores(qb, 'store', LAB_INVENTORY_SCOPE);

    // Assert
    expect(andWhere).toHaveBeenCalledTimes(1);
    expect(andWhere).toHaveBeenCalledWith(
      'store.department IN (:...scopeDepartments)',
      {
        scopeDepartments: [Department.MAIN_LABORATORY],
      },
    );
  });
});
