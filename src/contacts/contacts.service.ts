import {
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { BaseCrudService } from '../../common/services/crud.service';

@Injectable()
export class ContactsService extends BaseCrudService<Contact> {
  constructor(
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {
    super(contactsRepository)
  }
}
