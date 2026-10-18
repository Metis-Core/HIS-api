import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DateRangeFilterDTO } from 'common/dto/date-range.dto';
import { toList } from 'common/utils/query-list';
import { LabOrderItemStatus } from '../enums/lab-order-item-status.enum';

/** C1: the lab bench board, one row per test. */
export class QueryLabItemsDto extends DateRangeFilterDTO {
  @IsOptional()
  @Transform(toList)
  @IsEnum(LabOrderItemStatus, {
    each: true,
    message: 'status must be a valid lab item status',
  })
  status?: LabOrderItemStatus[];

  @IsOptional()
  @IsUUID('4', { message: 'testId must be a valid lab test id' })
  testId?: string;

  @IsOptional()
  @IsString({ message: 'search must be text' })
  @MaxLength(64, { message: 'search must be at most 64 characters' })
  search?: string;
}
