import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MESSAGE_TEAM_KEYS } from '../message-teams';
import type { MessageTeam } from '../message-teams';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SendMessageDto {
  /** One person; leave empty when writing to a team. */
  @ValidateIf((dto: SendMessageDto) => !dto.team)
  @IsUUID()
  recipientId?: string;

  /** A whole team, e.g. pharmacy, so whoever is on duty reads it. */
  @IsOptional()
  @IsIn(MESSAGE_TEAM_KEYS)
  team?: MessageTeam;

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
