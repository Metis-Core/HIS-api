import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from 'common/services/crud.service';
import { ServicesService } from 'src/services/services.service';
import { CreateVisitChargeDto } from './dto/create-visit-charge.dto';
import { VisitCharge } from './entities/visit-charge.entity';
import { ChargeSource, ChargeStatus } from './enums/charge.enum';

export interface VisitBill {
  readonly items: VisitCharge[];
  readonly total: number;
  readonly outstanding: number;
}

@Injectable()
export class PaymentsService extends BaseCrudService<VisitCharge> {
  constructor(
    @InjectRepository(VisitCharge)
    private readonly charges: Repository<VisitCharge>,
    private readonly servicesService: ServicesService,
  ) {
    super(charges);
  }

  async billForVisit(visitId: string): Promise<VisitBill> {
    const items = await this.charges.find({
      where: { visitId },
      order: { createdAt: 'ASC' },
    });
    const billable = items.filter((c) => c.status !== ChargeStatus.WAIVED);
    return {
      items,
      total: billable.reduce((sum, c) => sum + c.amount, 0),
      outstanding: billable
        .filter((c) => c.status === ChargeStatus.PENDING)
        .reduce((sum, c) => sum + c.amount, 0),
    };
  }

  async addCharge(dto: CreateVisitChargeDto, addedById: string | null): Promise<VisitCharge> {
    const quantity = dto.quantity ?? 1;
    if (dto.serviceId) {
      const service = await this.servicesService.findOne(dto.serviceId);
      return this.record({
        visitId: dto.visitId,
        source: ChargeSource.SERVICE,
        referenceId: service.id,
        description: service.name,
        unitPrice: service.fee,
        quantity,
        addedById,
      });
    }
    return this.record({
      visitId: dto.visitId,
      source: ChargeSource.OTHER,
      referenceId: null,
      description: dto.description!.trim(),
      unitPrice: dto.unitPrice!,
      quantity,
      addedById,
    });
  }

  async addConsultationFee(visitId: string, addedById: string): Promise<VisitCharge | null> {
    const service = await this.servicesService.findConsultationService();
    if (!service) return null;
    return this.record({
      visitId,
      source: ChargeSource.CONSULTATION,
      referenceId: service.id,
      description: service.name,
      unitPrice: service.fee,
      quantity: 1,
      addedById,
    });
  }

  async addLabCharges(
    visitId: string,
    items: readonly { itemId: string; testName: string; price: number }[],
    addedById: string,
  ): Promise<VisitCharge[]> {
    const rows = items.map((item) =>
      this.charges.create({
        visitId,
        source: ChargeSource.LAB,
        referenceId: item.itemId,
        description: item.testName,
        unitPrice: item.price,
        quantity: 1,
        amount: item.price,
        addedById,
      }),
    );
    return this.charges.save(rows);
  }

  async setStatus(id: string, status: ChargeStatus): Promise<VisitCharge> {
    const charge = await this.findOne(id);
    charge.status = status;
    return this.charges.save(charge);
  }

  override async remove(id: string): Promise<void> {
    const charge = await this.findOne(id);
    if (charge.status !== ChargeStatus.PENDING) {
      throw new BadRequestException('Only pending charges can be removed');
    }
    await super.remove(id);
  }

  private record(
    charge: Pick<VisitCharge, 'visitId' | 'source' | 'referenceId' | 'description' | 'unitPrice' | 'quantity' | 'addedById'>,
  ): Promise<VisitCharge> {
    return this.charges.save(
      this.charges.create({ ...charge, amount: charge.unitPrice * charge.quantity }),
    );
  }
}
