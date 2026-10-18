import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import { DocumentsService } from './documents.service';
import { LabDocumentsService } from './lab-documents.service';

// Patient documents must never be cached by browsers or proxies.
function sendDocument(res: Response, html: string): void {
  res.setHeader('Cache-Control', 'no-store');
  res.type('html').send(html);
}

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly labDocuments: LabDocumentsService,
  ) {}

  @Get('lab-order/:id')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async labOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.labDocuments.renderOrder(id, print === '1');
    sendDocument(res, html);
  }

  @Get('lab-report/visit/:visitId')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async labVisitReport(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.labDocuments.renderVisit(visitId, print === '1');
    sendDocument(res, html);
  }

  @Get('prescription/:id')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.PHARMACIST)
  async prescription(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderPrescription(id, print === '1');
    sendDocument(res, html);
  }

  @Get('discharge/:consultationId')
  @Roles(RoleGroups.CLINICAL_STAFF)
  async discharge(
    @Param('consultationId', ParseUUIDPipe) consultationId: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderDischargeSummary(
      consultationId,
      print === '1',
    );
    sendDocument(res, html);
  }

  @Get('receipt/:visitId')
  @Roles(RoleGroups.CLINICAL_STAFF, RoleGroups.BILLING)
  async receipt(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderVisitReceipt(
      visitId,
      print === '1',
    );
    sendDocument(res, html);
  }

  @Get('procedure-report/:id')
  @Roles(RoleGroups.CLINICAL_STAFF)
  async procedureReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('print') print: string | undefined,
    @Res() res: Response,
  ) {
    const html = await this.documents.renderProcedureReport(id, print === '1');
    sendDocument(res, html);
  }
}
