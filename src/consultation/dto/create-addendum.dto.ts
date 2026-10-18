import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAddendumDTO {
  @IsString({ message: 'The addendum must be text' })
  @IsNotEmpty({ message: 'Write the addendum before saving it' })
  @MaxLength(5000, { message: 'An addendum can be at most 5000 characters' })
  body: string;
}
