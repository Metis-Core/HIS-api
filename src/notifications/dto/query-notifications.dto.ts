import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationType } from '../enums/notification-type.enum';

export class QueryNotificationsDto extends BaseFilterDTO {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
