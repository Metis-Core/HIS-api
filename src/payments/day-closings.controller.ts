import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { PaginationQueryDTO } from 'common/pagination';
import { formatResponse } from 'common/response-format';
import { DayClosingService } from './day-closing.service';
import { CloseDayDto } from './dto/close-day.dto';
import { PreviewDayDto } from './dto/preview-day.dto';

@Controller('day-closings')
export class DayClosingsController {
  constructor(private readonly closings: DayClosingService) {}

  @Get()
  @Roles(RoleGroups.FINANCE_MANAGERS)
  async list(@Query() query: PaginationQueryDTO) {
    return formatResponse(await this.closings.list(query));
  }

  @Get('preview')
  @Roles(RoleGroups.FINANCE_MANAGERS)
  async preview(@Query() query: PreviewDayDto) {
    return formatResponse(await this.closings.preview(query.date));
  }

  @Post()
  @Roles(RoleGroups.FINANCE_MANAGERS)
  async close(
    @Body() dto: CloseDayDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.closings.close(dto, user.id));
  }

  @Delete(':date')
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async reopen(@Param('date') date: string): Promise<void> {
    await this.closings.reopen(date);
  }
}
