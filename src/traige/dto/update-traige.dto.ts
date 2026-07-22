import { PartialType } from '@nestjs/mapped-types';
import { CreateTraigeDto } from './create-traige.dto';

export class UpdateTraigeDto extends PartialType(CreateTraigeDto) {}
