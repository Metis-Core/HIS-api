import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from 'common/decorators/public.decorator';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Public()
  @Get('lab-order/:id')
  async labOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderLabOrder(id, print === '1');
    res.type('html').send(html);
  }

  @Public()
  @Get('prescription/:id')
  async prescription(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderPrescription(id, print === '1');
    res.type('html').send(html);
  }

  @Public()
  @Get('discharge/:consultationId')
  async discharge(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderDischargeSummary(consultationId, print === '1');
    res.type('html').send(html);
  }

  @Public()
  @Get('receipt/:visitId')
  async receipt(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderVisitReceipt(visitId, print === '1');
    res.type('html').send(html);
  }
}
