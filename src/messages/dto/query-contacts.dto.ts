import { IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryContactsDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  search?: string;
}
