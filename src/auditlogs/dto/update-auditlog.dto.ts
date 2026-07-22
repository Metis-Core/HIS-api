import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditlogDto } from './create-auditlog.dto';

export class UpdateAuditlogDto extends PartialType(CreateAuditlogDto) {}
