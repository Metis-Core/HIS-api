import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryStoreDto } from './create-inventory-store.dto';

export class UpdateInventoryStoreDto extends PartialType(CreateInventoryStoreDto) {}
