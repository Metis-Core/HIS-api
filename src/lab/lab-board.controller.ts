import { Controller, Get, Query } from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { DateRangeFilterDTO } from 'common/dto/date-range.dto';
import { Roles } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import { QueryLabItemsDto } from './dto/query-lab-items.dto';
import { LabBoardService } from './lab-board.service';

@Controller('lab/items')
export class LabBoardController {
  constructor(private readonly board: LabBoardService) {}

  @Get()
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  findItems(@Query() query: QueryLabItemsDto) {
    return this.board.search(query);
  }

  @Get('summary')
  @Roles(UserRole.LAB_TECH, RoleGroups.ADMINS)
  summary(@Query() query: DateRangeFilterDTO) {
    return this.board.summary(query);
  }
}
