import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

export class UpdateInventoryItemDto extends PartialType(
  OmitType(CreateInventoryItemDto, ['initialStock'] as const),
) {}
