import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { IPagination } from 'common/response-format';
import { ServicesService } from './services.service';
import { CreateServiceDTO } from './dto/create-service.dto';
import { ServiceResponseDTO } from './dto/service-response.dto';
import { QueryServicesDTO } from './dto/query-services.dto';
import { UpdateServiceDTO } from './dto/update-service.dto';

// Guards are global (APP_GUARD); routes without @Roles allow any signed-in user.
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(RoleGroups.ADMINS)
  async create(
    @Body() createServiceDTO: CreateServiceDTO,
  ): Promise<ServiceResponseDTO> {
    return ServiceResponseDTO.fromEntity(
      await this.servicesService.create(createServiceDTO),
    );
  }

  @Get()
  async findAll(
    @Query() query: QueryServicesDTO,
  ): Promise<IPagination<ServiceResponseDTO>> {
    const page = await this.servicesService.findAllPaginated(query);
    return { ...page, items: ServiceResponseDTO.fromEntities(page.items) };
  }

  @Get('consultation-fee')
  @Roles(RoleGroups.FLOOR_STAFF)
  async consultationFee(): Promise<ServiceResponseDTO> {
    const service = await this.servicesService.findConsultationService();
    if (!service) {
      throw new NotFoundException(
        'No active consultation service is configured',
      );
    }
    return ServiceResponseDTO.fromEntity(service);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceResponseDTO> {
    return ServiceResponseDTO.fromEntity(
      await this.servicesService.findOne(id),
    );
  }

  @Patch(':id')
  @Roles(RoleGroups.ADMINS)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDTO: UpdateServiceDTO,
  ): Promise<ServiceResponseDTO> {
    return ServiceResponseDTO.fromEntity(
      await this.servicesService.update(id, updateServiceDTO),
    );
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }
}
