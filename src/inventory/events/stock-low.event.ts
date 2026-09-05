export class StockLowEvent {
  static readonly name = 'inventory.stock.low';
  constructor(
    public readonly itemId: string,
    public readonly storeId: string,
    public readonly currentQuantity: number,
    public readonly minStockLevel: number,
  ) {}
}
