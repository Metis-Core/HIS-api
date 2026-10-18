import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryInventoryStockDTO } from './query-inventory-stock.dto';

const ITEM_A = '0b6f2d4e-6c1a-4f37-9a52-1f4c9e0d7a11';
const ITEM_B = '7d3e8a90-2b4c-4e5f-8a1b-3c2d1e0f9a22';

describe('QueryInventoryStockDTO', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('splits a comma-separated itemIds list into ids', async () => {
    // Arrange
    const dto = plainToInstance(QueryInventoryStockDTO, {
      itemIds: `${ITEM_A},${ITEM_B}`,
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
    expect(dto.itemIds).toEqual([ITEM_A, ITEM_B]);
  });

  it('rejects an itemIds entry that is not an id', async () => {
    // Arrange
    const dto = plainToInstance(QueryInventoryStockDTO, {
      itemIds: `${ITEM_A},nope`,
    });

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.map((e) => e.property)).toEqual(['itemIds']);
  });
});
