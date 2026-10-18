import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientsService } from 'src/patients/patients.service';
import { Visit } from 'src/queue/entities/visit.entity';
import { UsersService } from 'src/users/users.service';
import {
  ConsultationActor,
  assertCanAssignDoctor,
  assertIsDoctor,
} from './consultation-access.policy';

/** Checks the patient, doctor and visit a consultation points at. */
@Injectable()
export class ConsultationReferencesService {
  constructor(
    @InjectRepository(Visit)
    private readonly visits: Repository<Visit>,
    private readonly patients: PatientsService,
    private readonly users: UsersService,
  ) {}

  async assertPatient(patientId: string): Promise<void> {
    await this.patients.findOne(patientId);
  }

  async assertAssignableDoctor(
    doctorId: string,
    actor: ConsultationActor,
  ): Promise<void> {
    assertCanAssignDoctor(doctorId, actor);
    assertIsDoctor(await this.users.findOne(doctorId));
  }

  async assertVisitOfPatient(
    visitId: string,
    patientId: string,
  ): Promise<void> {
    const visit = await this.visits.findOne({
      where: { id: visitId },
      select: { id: true, patientId: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.patientId !== patientId) {
      throw new BadRequestException('Visit does not belong to this patient');
    }
  }
}
