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
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { patientScopeFor } from './patient-scope.policy';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientFiltersDto } from './dto/patient-filters.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';
import { formatResponse } from '../../common/response-format';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() entity: CreatePatientDto) {
    const patient = await this.patientsService.create({ ...entity });
    return formatResponse(patient);
  }

  @Get()
  @Roles(RoleGroups.FLOOR_STAFF)
  async findAll(
    @Query() query: PatientFiltersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(
      await this.patientsService.search(query, patientScopeFor(user.role)),
    );
  }

  @Get(':id')
  @Roles(RoleGroups.FLOOR_STAFF)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const patient = await this.patientsService.findOneInScope(
      id,
      patientScopeFor(user.role),
    );
    return formatResponse(patient);
  }

  @Patch(':id')
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Put(':id')
  @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.remove(id);
  }
}
