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
  UseInterceptors,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { Roles } from 'common/decorators/roles.decorator';
import { formatErrorResponse, formatResponse, IPagination } from 'common/response-format';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles(RoleGroups.ADMINS)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(
      await this.usersService.create(createUserDto),
    );
  }

  @Get()
  @Roles(RoleGroups.ADMINS)
  async findAll(): Promise<IPagination<any> | any> {
    try {
      return formatResponse(await this.usersService.findManyWithPagination())
    } catch (error) {
      return formatErrorResponse(error)
    }
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(await this.usersService.findOne(id));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(
      await this.usersService.update(id, updateUserDto),
    );
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
