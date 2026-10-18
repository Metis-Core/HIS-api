import { BadRequestException } from '@nestjs/common';
import { ServiceVisitKind } from '../enums/service-visit.enum';
import { VisitIntenentsEnum, VisitTypeEnum } from '../enums/visit-type.enum';
import { planCheckIn, wantsConsultation } from './check-in-plan';

describe('planCheckIn', () => {
  it('defaults to triage then consultation', () => {
    expect(planCheckIn({})).toEqual([
      VisitIntenentsEnum.EXAMINATION,
      VisitIntenentsEnum.CONSULTATION,
    ]);
  });

  it('keeps triage on for a procedure-only visit', () => {
    expect(
      planCheckIn({
        consultation: false,
        stages: [VisitIntenentsEnum.SURGERY],
      }),
    ).toEqual([VisitIntenentsEnum.EXAMINATION, VisitIntenentsEnum.SURGERY]);
  });

  it('lets reception switch triage off', () => {
    expect(
      planCheckIn({
        triage: false,
        consultation: false,
        service: ServiceVisitKind.IMMUNIZATION,
      }),
    ).toEqual([VisitIntenentsEnum.IMMUNIZATION]);
  });

  it('orders the consultation before the maternity service and the booked stages', () => {
    expect(
      planCheckIn({
        service: ServiceVisitKind.ANTENATAL,
        stages: [VisitIntenentsEnum.LAB],
      }),
    ).toEqual([
      VisitIntenentsEnum.EXAMINATION,
      VisitIntenentsEnum.CONSULTATION,
      VisitIntenentsEnum.ANTENATAL,
      VisitIntenentsEnum.LAB,
    ]);
  });

  it('forces triage and a consultation for an emergency', () => {
    expect(
      planCheckIn({
        visitType: VisitTypeEnum.EMERGENCY,
        triage: false,
        consultation: false,
      }),
    ).toEqual([
      VisitIntenentsEnum.EXAMINATION,
      VisitIntenentsEnum.CONSULTATION,
    ]);
  });

  it('asks for a reason when nothing was chosen, and refuses stages that cannot be booked', () => {
    expect(() => planCheckIn({ consultation: false })).toThrow(
      BadRequestException,
    );
    expect(() =>
      planCheckIn({ stages: [VisitIntenentsEnum.PHARMACY] }),
    ).toThrow(BadRequestException);
  });
});

describe('wantsConsultation', () => {
  it('is true unless the recorded stages leave the consultation out', () => {
    expect(
      wantsConsultation({ initialIntents: ['triage', 'consultation'] }),
    ).toBe(true);
    expect(wantsConsultation({ initialIntents: ['triage', 'surgery'] })).toBe(
      false,
    );
    expect(wantsConsultation({})).toBe(true);
    expect(wantsConsultation(null)).toBe(true);
  });
});
