import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDTO } from 'common/pagination';
import { DiagnosisCodeSystem } from '../enums/diagnosis-code-system.enum';

export class QueryDiagnosisCodesDTO extends PaginationQueryDTO {
  @IsOptional()
  @IsString({ message: 'search must be text' })
  @MaxLength(100, { message: 'search can be at most 100 characters' })
  search?: string;

  @IsOptional()
  @IsEnum(DiagnosisCodeSystem, { message: 'system is not a known code system' })
  system?: DiagnosisCodeSystem;
}
