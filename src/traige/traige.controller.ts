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
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { TriageStatus } from 'src/traige/enums/triage-status.enum';
import { CreateTriageDto } from './dto/create-traige.dto';
import { QueryTriageDto } from './dto/query-triage.dto';
import { UpdateTriageDto } from './dto/update-traige.dto';
import { TraigeService } from './traige.service';

@Controller('triage')
export class TraigeController {
  constructor(private readonly traigeService: TraigeService) {}

  @Post()
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTriageDto: CreateTriageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.traigeService.createTriage(createTriageDto, user.id);
  }

  @Get()
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  findAll(@Query() query: QueryTriageDto) {
    return this.traigeService.search(query);
  }

  @Get('queue')
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  findQueue(@Query('status') status?: TriageStatus) {
    return this.traigeService.findQueue(status ?? TriageStatus.WAITING);
  }

  @Get('patient/:patientId')
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.traigeService.findByPatient(patientId);
  }

  @Get(':id')
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.traigeService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTriageDto: UpdateTriageDto,
  ) {
    return this.traigeService.updateTriage(id, updateTriageDto);
  }

  @Put(':id')
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTriageDto: UpdateTriageDto,
  ) {
    return this.traigeService.updateTriage(id, updateTriageDto);
  }

  @Delete(':id')
  @Roles(RoleGroups.NURSING_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.traigeService.cancel(id);
  }
}
