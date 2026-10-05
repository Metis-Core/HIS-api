import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateVisitChargeDto {
  @IsUUID()
  visitId: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ValidateIf((dto: CreateVisitChargeDto) => !dto.serviceId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description?: string;

  @ValidateIf((dto: CreateVisitChargeDto) => !dto.serviceId)
  @IsInt()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
