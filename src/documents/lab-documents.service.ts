import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { LabOrder } from 'src/lab/entities/lab-order.entity';
import { LabResultAmendment } from 'src/lab/entities/lab-result-amendment.entity';
import { renderHtml } from './render-html';
import { renderLabReport } from './templates/lab-report.template';

const REPORT_RELATIONS = {
  patient: true,
  orderedBy: true,
  items: { test: true, verifiedBy: true },
} as const;

/** L7: printable lab reports for one order or every order on a visit. */
@Injectable()
export class LabDocumentsService {
  constructor(
    @InjectRepository(LabOrder)
    private readonly orders: Repository<LabOrder>,
    @InjectRepository(LabResultAmendment)
    private readonly amendments: Repository<LabResultAmendment>,
  ) {}

  async renderOrder(id: string, autoPrint = false): Promise<string> {
    return this.render({ id }, 'Lab order not found', autoPrint);
  }

  async renderVisit(visitId: string, autoPrint = false): Promise<string> {
    return this.render(
      { visitId },
      'No lab orders were found for this visit',
      autoPrint,
    );
  }

  private async render(
    where: FindOptionsWhere<LabOrder>,
    missing: string,
    autoPrint: boolean,
  ): Promise<string> {
    const orders = await this.orders.find({
      where,
      relations: REPORT_RELATIONS,
      order: { createdAt: 'ASC', items: { createdAt: 'ASC' } },
    });
    if (orders.length === 0) throw new NotFoundException(missing);
    const itemIds = orders.flatMap((order) => order.items.map((i) => i.id));
    const amended = itemIds.length
      ? await this.amendments.find({
          where: { itemId: In(itemIds) },
          select: { itemId: true },
        })
      : [];
    const mjml = renderLabReport({
      patient: orders[0].patient,
      orders,
      amendedItemIds: new Set(amended.map((a) => a.itemId)),
    });
    return renderHtml(mjml, { autoPrint });
  }
}
