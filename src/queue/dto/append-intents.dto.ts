import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEnum } from 'class-validator';
import { VisitIntenentsEnum } from '../enums/visit-type.enum';

export class AppendIntentsDTO {
  @IsArray({ message: 'intents must be a list' })
  @ArrayNotEmpty({ message: 'intents must not be empty' })
  @ArrayMaxSize(10, { message: 'intents may hold at most 10 stages' })
  @IsEnum(VisitIntenentsEnum, {
    each: true,
    message: `each intent must be one of: ${Object.values(VisitIntenentsEnum).join(', ')}`,
  })
  intents: VisitIntenentsEnum[];
}
