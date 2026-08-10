import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Department } from 'common/enums/department.enum';

export class TransferQueueEntryDto {
  @IsEnum(Department)
  nextDepartment: Department;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
