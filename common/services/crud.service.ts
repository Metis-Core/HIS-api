import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import {
    Repository,
    DeepPartial,
    FindOptionsWhere,
    FindOneOptions,
    FindManyOptions,
  } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { IPagination } from '../response-format';
  
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
      try {
        const query = this.repository.createQueryBuilder();
        query.setFindOptions({
          skip: options && options.skip ? Number(options.skip) : 0,
          take: options && options.take ? Number(options.take) : 10,
        });
  
        query.setFindOptions({
          ...(options && options.relations
            ? { relations: options.relations }
            : {}),
          ...(options && options.where ? { where: options.where } : {}),
          ...(options && options.order ? { order: options.order } : {}),
        });
  
        const [items, total] = await query.getManyAndCount();
        return { items, total };
      } catch (error) {
        throw new BadRequestException(error);
      }
    }
  
    async findOneByWhere(options: FindOneOptions<T>): Promise<T | undefined> {
      const entity = await this.repository.findOne(options);
      if (!entity) {
        return undefined;
      }
      return entity;
    }
  
    async update(id: string, updateDto: DeepPartial<T>): Promise<T> {
      await this.findOne(id);
      await this.repository.update({ id } as any, updateDto as any);
      return await this.findOne(id);
    }
  
    async remove(id: string): Promise<void> {
      const result = await this.repository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }
    }
  }