import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SendMessageDto {
  @IsUUID()
  recipientId: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;

  /** The visit the message is about, so the reader can open the patient. */
  @IsOptional()
  @IsUUID()
  visitId?: string;
}
