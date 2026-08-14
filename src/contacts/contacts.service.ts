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

  async upsertForPatient(
    patientId: string,
    dto: { name: string; phone: string; relationship?: string },
  ): Promise<Contact> {
    const existing = await this.contactsRepository.findOne({ where: { patientId } });
    if (existing) {
      await this.contactsRepository.update({ patientId }, dto);
      return this.contactsRepository.findOne({ where: { patientId } }) as Promise<Contact>;
    }
    return this.contactsRepository.save(
      this.contactsRepository.create({ patientId, ...dto }),
    );
  }
}
