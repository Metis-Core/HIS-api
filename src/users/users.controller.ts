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
  UseInterceptors,
} from '@nestjs/common';
import { RoleGroups } from 'common/access/role-groups';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import { Roles } from 'common/decorators/roles.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { formatResponse } from 'common/response-format';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { assertCanView } from './user-access.policy';
import { UsersService } from './users.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(RoleGroups.ADMINS)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(
      await this.usersService.create(createUserDto),
    );
  }

  @Get()
  @Roles(RoleGroups.ADMINS)
  async findAll(@Query() query: QueryUsersDto) {
    const page = await this.usersService.search(query);
    return formatResponse({
      ...page,
      items: UserResponseDto.fromEntities(page.items),
    });
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    assertCanView(actor, id);
    return UserResponseDto.fromEntity(await this.usersService.findOne(id));
  }

  @Patch(':id')
  @Roles(RoleGroups.ADMINS)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(
      await this.usersService.updateAsActor(id, updateUserDto, actor),
    );
  }

  @Delete(':id')
  @Roles(RoleGroups.ADMINS)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.removeAsActor(id, actor);
  }
}
