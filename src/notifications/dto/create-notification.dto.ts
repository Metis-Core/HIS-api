import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  actionUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceType?: string;

  @IsOptional()
  @IsUUID()
  resourceId?: string;
}
