import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ConsultationDiagnosisDTO {
  @IsUUID(undefined, { message: 'codeId must be a diagnosis code id' })
  codeId: string;

  @IsOptional()
  @IsBoolean({ message: 'isPrimary must be true or false' })
  isPrimary?: boolean;
}
