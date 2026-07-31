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
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { UserRole } from 'common/enums/userRoles.enum';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';
import { TriageStatus } from 'src/traige/enums/triage-status.enum';
import { CreateTriageDto } from './dto/create-traige.dto';
import { QueryTriageDto } from './dto/query-triage.dto';
import { UpdateTriageDto } from './dto/update-traige.dto';
import { TraigeService } from './traige.service';

const TRIAGE_STAFF = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.RECEPTIONIST,
] as const;

@Controller('triage')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TraigeController {
  constructor(private readonly traigeService: TraigeService) {}

  @Post()
  @Roles(...TRIAGE_STAFF)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTriageDto: CreateTriageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.traigeService.create(createTriageDto, user.id);
  }

  @Get()
  @Roles(...TRIAGE_STAFF)
  findAll(@Query() query: QueryTriageDto) {
    return this.traigeService.findAll(query);
  }

  @Get('queue')
  @Roles(...TRIAGE_STAFF)
  findQueue(@Query('status') status?: TriageStatus) {
    return this.traigeService.findQueue(status ?? TriageStatus.WAITING);
  }

  @Get('patient/:patientId')
  @Roles(...TRIAGE_STAFF)
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.traigeService.findByPatient(patientId);
  }

  @Get(':id')
  @Roles(...TRIAGE_STAFF)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.traigeService.findOne(id);
  }

  @Patch(':id')
  @Roles(...TRIAGE_STAFF)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTriageDto: UpdateTriageDto,
  ) {
    return this.traigeService.update(id, updateTriageDto);
  }

  @Put(':id')
  @Roles(...TRIAGE_STAFF)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTriageDto: UpdateTriageDto,
  ) {
    return this.traigeService.update(id, updateTriageDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.NURSE)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.traigeService.remove(id);
  }
}
