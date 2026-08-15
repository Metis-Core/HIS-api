import { PartialType } from '@nestjs/mapped-types';
import { IsUUID } from 'class-validator';
import { CreateQueueDTO } from './create-queue.dto';

export class UpdateQueueDTO extends PartialType(CreateQueueDTO) {
  @IsUUID()
  id: string
}
