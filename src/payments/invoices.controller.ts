import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { VoidPaymentDto } from './dto/void-payment.dto';
import { InvoicesService } from './invoices.service';
import { PaymentLedgerService } from './payment-ledger.service';
import { ReceiptPdfService } from './receipt-pdf.service';

const PDF_HEADERS = 'application/pdf';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly pdf: ReceiptPdfService,
  ) {}

  @Get()
  @Roles(RoleGroups.BILLING)
  async list(@Query() query: QueryInvoicesDto) {
    return formatResponse(await this.invoices.search(query));
  }

  @Get('visit/:visitId')
  @Roles(RoleGroups.FLOOR_STAFF)
  async forVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return formatResponse(await this.invoices.forVisit(visitId));
  }

  @Get(':id')
  @Roles(RoleGroups.FLOOR_STAFF)
  async one(@Param('id', ParseUUIDPipe) id: string) {
    return formatResponse(await this.invoices.details(id));
  }

  @Get(':id/pdf')
  @Roles(RoleGroups.BILLING)
  @Header('Content-Type', PDF_HEADERS)
  @Header('Cache-Control', 'no-store')
  async document(@Param('id', ParseUUIDPipe) id: string) {
    return new StreamableFile(
      await this.pdf.invoice(await this.invoices.details(id)),
    );
  }
}

@Controller('payments')
export class PaymentLedgerController {
  constructor(
    private readonly ledger: PaymentLedgerService,
    private readonly invoices: InvoicesService,
    private readonly pdf: ReceiptPdfService,
  ) {}

  @Post()
  @Roles(RoleGroups.BILLING)
  async record(
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.ledger.record(dto, user.id));
  }

  @Get()
  @Roles(RoleGroups.BILLING)
  async list(@Query() query: QueryPaymentsDto) {
    return formatResponse(await this.ledger.search(query));
  }

  @Get(':id')
  @Roles(RoleGroups.BILLING)
  async one(@Param('id', ParseUUIDPipe) id: string) {
    return formatResponse(await this.ledger.details(id));
  }

  @Post(':id/void')
  @Roles(RoleGroups.FINANCE_MANAGERS)
  async void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.ledger.void(id, dto, user.id));
  }

  @Get(':id/receipt')
  @Roles(RoleGroups.BILLING)
  @Header('Content-Type', PDF_HEADERS)
  @Header('Cache-Control', 'no-store')
  async receipt(@Param('id', ParseUUIDPipe) id: string) {
    const payment = await this.ledger.details(id);
    const details = await this.invoices.details(payment.invoiceId);
    return new StreamableFile(await this.pdf.receipt(payment, details));
  }
}
