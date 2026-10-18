import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ReassignVisitDto {
  @IsUUID('4', { message: 'doctorId must be a valid id' })
  doctorId: string;

  @IsString()
  @MinLength(3, { message: 'Give a reason for moving the patient' })
  @MaxLength(255)
  reason: string;
}
