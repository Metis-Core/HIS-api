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
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientFiltersDto } from './dto/patient-filters.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';
import {
  formatErrorResponse,
  formatResponse,
} from '../../common/response-format';

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
  async findAll() {
    const patients = await this.patientsService.findManyWithPagination({
      relations: { contact: true },
    });
    return formatResponse(patients);
  }

  @Get(':id')
  @Roles(RoleGroups.FLOOR_STAFF)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const patient = await this.patientsService.findByStringId(id);
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
  @Roles(RoleGroups.RECEPTION)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.remove(id);
  }
}
