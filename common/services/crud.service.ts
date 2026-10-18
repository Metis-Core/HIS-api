import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Repository,
  DeepPartial,
  FindOptionsWhere,
  FindOneOptions,
  FindManyOptions,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { IPagination } from '../response-format';
import { DEFAULT_PAGE_SIZE, pageWindow, toPage } from '../pagination';

@Injectable()
export abstract class BaseCrudService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  async create(entity: DeepPartial<T>): Promise<T> {
    const _entity = this.repository.create(entity);
    return await this.repository.save(_entity);
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async findByStringId(id: string, options?: FindOneOptions<T>): Promise<T> {
    const entity = await this.repository.findOne({
      ...options,
      where: { id } as FindOptionsWhere<T>,
    });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async findByWhere(options: FindManyOptions<T>): Promise<T[]> {
    return await this.repository.find(options);
  }

  public async findManyWithPagination(
    options?: FindManyOptions<T>,
  ): Promise<IPagination<T>> {
    const take = options?.take ? Number(options.take) : undefined;
    const skip = options?.skip ? Number(options.skip) : 0;
    const limit = take ?? DEFAULT_PAGE_SIZE;
    return this.findPage(options ?? {}, {
      page: Math.floor(skip / limit) + 1,
      limit,
    });
  }

  /** One page of rows in the standard IPagination shape; page/limit are clamped to safe bounds. */
  public async findPage(
    options: Omit<FindManyOptions<T>, 'skip' | 'take'>,
    query: { page?: number; limit?: number } = {},
  ): Promise<IPagination<T>> {
    const window = pageWindow(query);
    const [items, total] = await this.repository.findAndCount({
      ...options,
      skip: window.skip,
      take: window.take,
    });
    return toPage(items, total, window);
  }

  async findOneByWhere(options: FindOneOptions<T>): Promise<T | undefined> {
    const entity = await this.repository.findOne(options);
    if (!entity) {
      return undefined;
    }
    return entity;
  }

  // Entity-level save/remove (not query-builder writes) so subscribers such as the audit log see the change.
  async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);
    await this.repository.save(this.repository.merge(entity, updateDto));
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
  }
}
