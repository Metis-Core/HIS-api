import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosisCodesService } from 'src/diagnoses/diagnosis-codes.service';
import { ConsultationDiagnosesService } from './consultation-diagnoses.service';

const malaria = {
  id: 'k1',
  system: 'ICD-10-CM',
  code: 'B54',
  title: 'Unspecified malaria',
};
const urti = {
  id: 'k2',
  system: 'ICD-10-CM',
  code: 'J06.9',
  title: 'Acute URTI',
};
const codes = { findByIds: jest.fn() };
const manager = {
  delete: jest.fn(),
  save: jest.fn(),
  create: jest.fn((_: unknown, value: object) => value),
};

describe('ConsultationDiagnosesService', () => {
  let service: ConsultationDiagnosesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationDiagnosesService,
        { provide: DiagnosisCodesService, useValue: codes },
      ],
    }).compile();
    service = module.get(ConsultationDiagnosesService);
  });

  it('copies code and title and keeps the picked order', async () => {
    // Arrange
    codes.findByIds.mockResolvedValue([urti, malaria]);

    // Act
    const rows = await service.resolve([
      { codeId: 'k1' },
      { codeId: 'k2', isPrimary: true },
    ]);

    // Assert
    expect(rows).toEqual([
      {
        diagnosisCodeId: 'k1',
        system: 'ICD-10-CM',
        code: 'B54',
        title: 'Unspecified malaria',
        isPrimary: false,
        rank: 0,
      },
      {
        diagnosisCodeId: 'k2',
        system: 'ICD-10-CM',
        code: 'J06.9',
        title: 'Acute URTI',
        isPrimary: true,
        rank: 1,
      },
    ]);
  });

  it('makes the first diagnosis primary when none is marked', async () => {
    // Arrange
    codes.findByIds.mockResolvedValue([malaria, urti]);

    // Act
    const rows = await service.resolve([{ codeId: 'k1' }, { codeId: 'k2' }]);

    // Assert
    expect(rows.map((row) => row.isPrimary)).toEqual([true, false]);
  });

  it.each([
    ['a repeated code', [{ codeId: 'k1' }, { codeId: 'k1' }], [malaria]],
    [
      'two primaries',
      [
        { codeId: 'k1', isPrimary: true },
        { codeId: 'k2', isPrimary: true },
      ],
      [malaria, urti],
    ],
    ['an unknown code', [{ codeId: 'k1' }, { codeId: 'k9' }], [malaria]],
  ])('refuses %s', async (_case, items, found) => {
    // Arrange
    codes.findByIds.mockResolvedValue(found);

    // Act
    const act = service.resolve(items);

    // Assert
    await expect(act).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replaces the stored set and clears it when the list is empty', async () => {
    // Arrange
    const rows: never[] = [];

    // Act
    await service.replace(manager as never, 'c1', rows);

    // Assert
    expect(manager.delete).toHaveBeenCalledWith(expect.anything(), {
      consultationId: 'c1',
    });
    expect(manager.save).not.toHaveBeenCalled();
  });
});
