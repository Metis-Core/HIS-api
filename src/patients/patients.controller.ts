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
  UseGuards,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientFiltersDto } from './dto/patient-filters.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';
import { formatErrorResponse, formatResponse } from '../../common/response-format';

@Controller('patients')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Post()
  // @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() entity: CreatePatientDto) {
    try {
      console.log('Entity here')
      console.log(entity)
      const patient = await this.patientsService.create({ ...entity })
      return formatResponse(patient)
    } catch (error) {
      console.log('We have an error')
      console.log(error)
    }
  }

  @Get()
  // @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  async findAll() {
    try {
      const patients = await this.patientsService.findManyWithPagination({ relations: { contact: true } })
      return formatResponse(patients)
    } catch (error) {
      console.log('We have an error')
      console.log(error)
    }
  }

  @Get(':id')
  // @Roles(RoleGroups.FRONT_DESK_CLINICAL)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const patient = await this.patientsService.findByStringId(id)
      return formatResponse(patient)
    } catch (error) {
      return formatErrorResponse(error)
    }
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
