import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from 'common/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'common/interfaces/authenticated-user.interface';
import { PaginationQueryDTO } from 'common/pagination';
import { formatResponse } from 'common/response-format';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

/** Every signed-in staff member can message every other; each sees only their own conversations. */
@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async send(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.messages.send(dto, user.id));
  }

  @Get('conversations')
  async conversations(@CurrentUser() user: AuthenticatedUser) {
    return formatResponse(await this.messages.conversations(user.id));
  }

  @Get('unread')
  async unread(@CurrentUser() user: AuthenticatedUser) {
    return formatResponse(await this.messages.unread(user.id));
  }

  @Get('contacts')
  async contacts(
    @Query() query: QueryContactsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.messages.contacts(user.id, query));
  }

  @Get('contacts/:userId')
  async contact(
    @Param('userId', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.messages.contactById(user.id, id));
  }

  @Get('with/:userId')
  async thread(
    @Param('userId', ParseUUIDPipe) otherId: string,
    @Query() query: PaginationQueryDTO,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.messages.thread(user.id, otherId, query));
  }

  @Post('with/:userId/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @Param('userId', ParseUUIDPipe) otherId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return formatResponse(await this.messages.markRead(user.id, otherId));
  }
}
