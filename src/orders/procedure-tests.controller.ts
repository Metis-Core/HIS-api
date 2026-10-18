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
import { Roles } from 'common/decorators/roles.decorator';
import { UserRole } from 'common/enums/userRoles.enum';
import { formatResponse } from 'common/response-format';
import {
  CreateProcedureTestDto,
  UpdateProcedureTestDto,
} from './dto/procedure-test.dto';
import { QueryProcedureTestsDto } from './dto/query-procedure-tests.dto';
import { ProcedureTestsService } from './procedure-tests.service';

@Controller('orders/tests')
export class ProcedureTestsController {
  constructor(private readonly tests: ProcedureTestsService) {}

  @Get()
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async list(@Query() query: QueryProcedureTestsDto) {
    return formatResponse(await this.tests.search(query));
  }

  @Get(':id')
  @Roles(RoleGroups.CLINICAL_STAFF, UserRole.LAB_TECH)
  async one(@Param('id', ParseUUIDPipe) id: string) {
    return formatResponse(await this.tests.findOne(id));
  }

  @Post()
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProcedureTestDto) {
    return formatResponse(await this.tests.create(dto));
  }

  @Patch(':id')
  @Roles(RoleGroups.ADMINS)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProcedureTestDto,
  ) {
    return formatResponse(await this.tests.edit(id, dto));
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tests.remove(id);
  }
}
