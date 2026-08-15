import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { IPagination } from 'common/response-format';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';
import { ServicesService } from './services.service';
import { CreateServiceDTO } from './dto/create-service.dto';
import { ServiceResponseDTO } from './dto/service-response.dto';
import { QueryServicesDTO } from './dto/query-services.dto';
import { UpdateServiceDTO } from './dto/update-service.dto';

@Controller('services')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @UseInterceptors(ClassSerializerInterceptor)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  // @Roles(RoleGroups.ADMINS)
  async create(
    @Body() createServiceDTO: CreateServiceDTO,
  ): Promise<ServiceResponseDTO> {
    return ServiceResponseDTO.fromEntity(
      await this.servicesService.create(createServiceDTO),
    );
  }

  @Get()
  // @Roles(RoleGroups.ADMINS)
  async findAll(
    @Query() query: QueryServicesDTO,
  ): Promise<IPagination<ServiceResponseDTO>> {
    const { items, total } = await this.servicesService.findAllPaginated(query);
    return { items: ServiceResponseDTO.fromEntities(items), total };
  }

  @Get(':id')
  // @Roles(RoleGroups.ADMINS)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceResponseDTO> {
    return ServiceResponseDTO.fromEntity(
      await this.servicesService.findOne(id),
    );
  }

  @Patch(':id')
  // @Roles(RoleGroups.ADMINS)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDTO: UpdateServiceDTO,
  ): Promise<ServiceResponseDTO> {
    return ServiceResponseDTO.fromEntity(
      await this.servicesService.update(id, updateServiceDTO),
    );
  }

  @Delete(':id')
  // @Roles(RoleGroups.ADMINS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }
}
