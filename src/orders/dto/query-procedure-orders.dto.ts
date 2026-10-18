import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { OrderKind } from '../enums/order-kind.enum';
import { OrderStatus } from '../enums/order-status.enum';

export class QueryProcedureOrdersDto extends BaseFilterDTO {
  @IsOptional()
  @IsEnum(OrderKind)
  kind?: OrderKind;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  @IsEnum(OrderStatus, { each: true })
  status?: OrderStatus[];

  @IsOptional()
  @IsUUID('4')
  patientId?: string;

  @IsOptional()
  @IsUUID('4')
  visitId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
