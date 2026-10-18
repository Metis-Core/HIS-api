import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationQueryDTO } from 'common/pagination';
import { IPagination } from 'common/response-format';
import { BaseCrudService } from 'common/services/crud.service';
import { LabOrderItem } from './entities/lab-order-item.entity';
import { LabResultAmendment } from './entities/lab-result-amendment.entity';

/** Read side of the amendment trail; amendments are only written by LabResultsService. */
@Injectable()
export class LabAmendmentsService extends BaseCrudService<LabResultAmendment> {
  constructor(
    @InjectRepository(LabResultAmendment)
    amendments: Repository<LabResultAmendment>,
    @InjectRepository(LabOrderItem)
    private readonly items: Repository<LabOrderItem>,
  ) {
    super(amendments);
  }

  async findForItem(
    orderId: string,
    itemId: string,
    query: PaginationQueryDTO,
  ): Promise<IPagination<LabResultAmendment>> {
    const exists = await this.items.exists({ where: { id: itemId, orderId } });
    if (!exists) throw new NotFoundException('Lab order item not found');
    return this.findPage(
      {
        where: { itemId },
        relations: { amendedBy: true },
        order: { createdAt: 'DESC', id: 'DESC' },
      },
      query,
    );
  }
}
