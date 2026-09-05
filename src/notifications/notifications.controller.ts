import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @Roles(RoleGroups.ADMINS)
  findAll(@Query() query: QueryNotificationsDto) {
    return this.notificationsService.search(query);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.findForUser(user.id, query);
  }

  @Get('me/unread-count')
  countMineUnread(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.countUnread(user.id);
  }

  @Post('me/read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.archive(id, user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleGroups.ADMINS)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.remove(id);
  }
}
