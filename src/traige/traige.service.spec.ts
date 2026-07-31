import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from 'src/patients/patients.service';
import { UsersService } from 'src/users/users.service';
import { Triage } from './entities/traige.entity';
import { TraigeService } from './traige.service';

describe('TraigeService', () => {
  let service: TraigeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraigeService,
        {
          provide: getRepositoryToken(Triage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: PatientsService,
          useValue: { findOne: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TraigeService>(TraigeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
