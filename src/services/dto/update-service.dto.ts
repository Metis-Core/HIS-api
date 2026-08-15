import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDTO } from './create-service.dto';

export class UpdateServiceDTO extends PartialType(CreateServiceDTO) {}
