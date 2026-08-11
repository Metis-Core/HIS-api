import {
  Controller,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'core/guards/jwt-auth.guard';
import { RolesGuard } from 'core/guards/roles.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactsController { }
