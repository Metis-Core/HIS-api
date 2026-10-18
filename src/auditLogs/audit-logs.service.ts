import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { buildPaginationMeta, IPagination } from 'common/response-format';
import { AuditLogQueryDTO } from './dto/audit-log-query.dto';
import { AuditLog } from './entities/audit-log.entity';

// Read-only on purpose: rows are written by AuditSubscriber and can never be changed.
@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
  ) {}

  async search(query: AuditLogQueryDTO): Promise<IPagination<AuditLog>> {
    const { page = 1, limit = 20, sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;
    const [items, total] = await this.auditLogs.findAndCount({
      where: this.buildWhere(query),
      order: { createdAt: sortOrder },
      skip,
      take: limit,
    });
    return { items, total, meta: buildPaginationMeta(total, skip, limit) };
  }

  private buildWhere(query: AuditLogQueryDTO): FindOptionsWhere<AuditLog> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.actorId) where.actorId = query.actorId;
    if (query.action) where.action = query.action;
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to) where.createdAt = Between(from, to);
    else if (from) where.createdAt = MoreThanOrEqual(from);
    else if (to) where.createdAt = LessThanOrEqual(to);
    return where;
  }
}
