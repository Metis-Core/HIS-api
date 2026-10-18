import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { PaginationQueryDTO } from 'common/pagination';
import { ConsultationAddendaService } from './consultation-addenda.service';
import { CreateAddendumDTO } from './dto/create-addendum.dto';

@Controller('consultations')
export class ConsultationAddendaController {
  constructor(private readonly addenda: ConsultationAddendaService) {}

  @Get(':id/addenda')
  @Roles(RoleGroups.CLINICAL_STAFF)
  list(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDTO,
  ) {
    return this.addenda.list(id, query);
  }

  @Post(':id/addenda')
  @Roles(RoleGroups.PROVIDERS)
  @HttpCode(HttpStatus.CREATED)
  add(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAddendumDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.addenda.add(id, dto, user);
  }
}
