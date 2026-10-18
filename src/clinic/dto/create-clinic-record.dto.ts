import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import type { LabResultData } from 'src/lab/results/result-schema.types';
import { ClinicRecordKind } from '../enums/clinic-record-kind.enum';

export class CreateClinicRecordDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  visitId?: string;

  @IsEnum(ClinicRecordKind)
  kind: ClinicRecordKind;

  @IsObject()
  data: LabResultData;
}
