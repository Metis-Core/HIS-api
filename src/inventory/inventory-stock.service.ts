import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { IPagination } from 'common/response-format';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { QueryInventoryTransactionsDto } from './dto/query-inventory-transactions.dto';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryStock } from './entities/inventory-stock.entity';
import { InventoryStore } from './entities/inventory-store.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryTransactionType } from './enums/inventoryTransactionType.enum';
import { QuantityUnit } from './enums/quantity-unit.enum';
import { StockLowEvent } from './events/stock-low.event';

const NEGATIVE_TXN_TYPES = new Set<InventoryTransactionType>([
  InventoryTransactionType.ISSUE,
  InventoryTransactionType.TRANSFER_OUT,
  InventoryTransactionType.ADJUSTMENT_OUT,
  InventoryTransactionType.DISPOSAL,
]);

const POSITIVE_TXN_TYPES = new Set<InventoryTransactionType>([
  InventoryTransactionType.RECEIPT,
  InventoryTransactionType.TRANSFER_IN,
  InventoryTransactionType.ADJUSTMENT_IN,
  InventoryTransactionType.RETURN,
]);

@Injectable()
export class InventoryStockService {
  constructor(
    @InjectRepository(InventoryStock)
    private readonly stockRepository: Repository<InventoryStock>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionsRepository: Repository<InventoryTransaction>,
    @InjectRepository(InventoryItem)
    private readonly itemsRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryStore)
    private readonly storesRepository: Repository<InventoryStore>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getStockLevels(storeId?: string): Promise<InventoryStock[]> {
    return this.stockRepository.find({
      where: storeId ? { storeId } : {},
      relations: { store: true, item: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async getStockFor(storeId: string, itemId: string): Promise<InventoryStock> {
    const stock = await this.stockRepository.findOne({
      where: { storeId, itemId },
      relations: { store: true, item: true },
    });
    if (!stock) {
      throw new NotFoundException('Stock record not found');
    }
    return stock;
  }

  async recordTransaction(
    dto: CreateInventoryTransactionDto,
    performedById: string,
    manager?: EntityManager,
  ): Promise<InventoryTransaction> {
    if (manager) {
      // Caller owns the transaction and must call notifyIfLow() after it commits.
      return this.record(manager, dto, performedById);
    }
    const txn = await this.dataSource.transaction((m) => this.record(m, dto, performedById));
    await this.notifyIfLow(txn);
    return txn;
  }

  /** Emits a low-stock event only when this movement pushed the balance down to or below the minimum. */
  async notifyIfLow(txn: InventoryTransaction): Promise<void> {
    if (!NEGATIVE_TXN_TYPES.has(txn.type)) return;
    const item = await this.itemsRepository.findOne({ where: { id: txn.itemId } });
    if (!item) return;
    const previousBalance = txn.runningBalance + txn.quantity;
    if (previousBalance > item.minStockLevel && txn.runningBalance <= item.minStockLevel) {
      this.eventEmitter.emit(
        StockLowEvent.name,
        new StockLowEvent(txn.itemId, txn.storeId, txn.runningBalance, item.minStockLevel),
      );
    }
  }

  private async record(
    manager: EntityManager,
    dto: CreateInventoryTransactionDto,
    performedById: string,
  ): Promise<InventoryTransaction> {
    if (dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const item = await manager.findOne(InventoryItem, { where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const store = await manager.findOne(InventoryStore, { where: { id: dto.storeId } });
    if (!store) throw new NotFoundException('Store not found');

    // Stock is always held in base units (e.g. tablets); packs are converted here.
    const quantity =
      dto.quantityUnit === QuantityUnit.PACK ? dto.quantity * item.packSize : dto.quantity;

    if (dto.type === InventoryTransactionType.TRANSFER_OUT) {
      if (!dto.counterpartStoreId) {
        throw new BadRequestException('counterpartStoreId is required for transfers');
      }
      if (dto.counterpartStoreId === dto.storeId) {
        throw new BadRequestException('Cannot transfer stock to the same store');
      }
      const counterpart = await manager.findOne(InventoryStore, {
        where: { id: dto.counterpartStoreId },
      });
      if (!counterpart) throw new NotFoundException('Counterpart store not found');
    }

    const primary = await this.applyStockChange(
      manager,
      item,
      dto.storeId,
      dto.type,
      quantity,
      performedById,
      dto,
    );

    if (dto.type === InventoryTransactionType.TRANSFER_OUT) {
      await this.applyStockChange(
        manager,
        item,
        dto.counterpartStoreId!,
        InventoryTransactionType.TRANSFER_IN,
        quantity,
        performedById,
        { ...dto, storeId: dto.counterpartStoreId!, counterpartStoreId: dto.storeId },
      );
    }

    return primary;
  }

  async searchTransactions(
    query: QueryInventoryTransactionsDto,
  ): Promise<IPagination<InventoryTransaction>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortOrder = query.sortOrder ?? 'DESC';

    const qb = this.transactionsRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.store', 'store')
      .leftJoinAndSelect('txn.item', 'item')
      .leftJoinAndSelect('txn.performedBy', 'performedBy');

    if (query.storeId) qb.andWhere('txn.storeId = :storeId', { storeId: query.storeId });
    if (query.itemId) qb.andWhere('txn.itemId = :itemId', { itemId: query.itemId });
    if (query.type) qb.andWhere('txn.type = :type', { type: query.type });
    if (query.performedById) qb.andWhere('txn.performedById = :performedById', { performedById: query.performedById });

    const [items, total] = await qb
      .orderBy('txn.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async listLowStock(): Promise<Array<InventoryStock & { minStockLevel: number }>> {
    const rows = await this.stockRepository
      .createQueryBuilder('stock')
      .innerJoinAndSelect('stock.item', 'item')
      .innerJoinAndSelect('stock.store', 'store')
      .where('stock.quantity <= item.minStockLevel')
      .orderBy('stock.quantity', 'ASC')
      .getMany();
    return rows.map((r) => Object.assign(r, { minStockLevel: r.item.minStockLevel }));
  }

  private async applyStockChange(
    manager: EntityManager,
    item: InventoryItem,
    storeId: string,
    type: InventoryTransactionType,
    quantity: number,
    performedById: string,
    dto: CreateInventoryTransactionDto,
  ): Promise<InventoryTransaction> {
    const itemId = item.id;
    // Row lock serialises concurrent movements so balances can't be double-spent.
    let stock = await manager.findOne(InventoryStock, {
      where: { storeId, itemId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!stock) {
      stock = manager.create(InventoryStock, { storeId, itemId, quantity: 0 });
      stock = await manager.save(stock);
    }

    const delta = POSITIVE_TXN_TYPES.has(type)
      ? quantity
      : NEGATIVE_TXN_TYPES.has(type)
        ? -quantity
        : 0;

    if (delta === 0) {
      throw new BadRequestException('Unsupported transaction type');
    }

    const newBalance = stock.quantity + delta;
    if (newBalance < 0) {
      throw new BadRequestException(
        `Insufficient stock for ${item.name}: ${stock.quantity} available, ${quantity} requested`,
      );
    }

    stock.quantity = newBalance;
    if (POSITIVE_TXN_TYPES.has(type)) {
      stock.lastRestockedAt = new Date();
    }
    await manager.save(stock);

    const txn = manager.create(InventoryTransaction, {
      storeId,
      itemId,
      type,
      quantity,
      runningBalance: newBalance,
      counterpartStoreId: dto.counterpartStoreId ?? null,
      referenceType: dto.referenceType ?? null,
      referenceId: dto.referenceId ?? null,
      performedById,
      notes: dto.notes ?? null,
      batchNumber: dto.batchNumber ?? null,
      expiryDate: dto.expiryDate ?? null,
      manufactureDate: dto.manufactureDate ?? null,
    });
    return manager.save(txn);
  }
}
