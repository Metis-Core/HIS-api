import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Patient } from './entities/patient.entity';

@Injectable()
@EventSubscriber()
export class PatientSubscriber implements EntitySubscriberInterface<Patient> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Patient;
  }

  async beforeInsert(event: InsertEvent<Patient>): Promise<void> {
    if (!event.entity.mrn) {
      event.entity.mrn = await this.generateMrn(event);
    }
  }

  private async generateMrn(event: InsertEvent<Patient>): Promise<string> {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const suffix = String(Math.floor(1000 + Math.random() * 9000));
      const mrn = `PAT-${stamp}-${suffix}`;
      const exists = await event.manager.exists(Patient, { where: { mrn } });
      if (!exists) {
        return mrn;
      }
    }

    throw new Error('Unable to generate a unique MRN');
  }
}
