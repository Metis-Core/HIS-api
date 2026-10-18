import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { ContactsService } from '../contacts/contacts.service';
import { Patient } from './entities/patient.entity';
import { PatientsService } from './patients.service';

describe('PatientsService.update', () => {
  const repository = {
    findOne: jest.fn(),
    merge: jest.fn((entity: object, changes: object) =>
      Object.assign(entity, changes),
    ),
    save: jest.fn(),
  };
  const contacts = { upsertForPatient: jest.fn() };
  const events = { emit: jest.fn() };
  let service: PatientsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatientsService(
      repository as unknown as Repository<Patient>,
      contacts as unknown as ContactsService,
      events as unknown as EventEmitter2,
    );
  });

  it('refuses to save a patient that has no next of kin unless one is supplied', async () => {
    // Arrange
    repository.findOne.mockResolvedValue({ id: 'p1', contact: null });

    // Act
    const act = service.update('p1', { firstName: 'Jane' });

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('saves when the stored next of kin exists', async () => {
    // Arrange
    repository.findOne.mockResolvedValue({
      id: 'p1',
      status: 'active',
      contact: { id: 'c1' },
    });

    // Act
    await service.update('p1', { firstName: 'Jane' });

    // Assert
    expect(repository.save).toHaveBeenCalled();
    expect(contacts.upsertForPatient).not.toHaveBeenCalled();
  });
});
