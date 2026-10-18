import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseFilterDTO } from 'common/dto/filter.dto';
import { NotificationStatus } from '../enums/notification-status.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

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

  @IsOptional()
  @IsEnum(NotificationPriority, {
    message: 'priority is not a valid notification priority',
  })
  priority?: NotificationPriority;
}
