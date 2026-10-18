import { Controller, Get, Query } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { formatResponse } from 'common/response-format';
import { AnalyticsRangeDto } from './analytics-range.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(RoleGroups.FINANCE_MANAGERS)
  async overview(@Query() range: AnalyticsRangeDto) {
    return formatResponse(await this.analyticsService.overview(range));
  }
}
