import { Department } from 'common/enums/department.enum';
import { VisitIntenentsEnum } from 'src/queue/enums/visit-type.enum';

export const intentDepartmentMap: Record<VisitIntenentsEnum, Department> = {
  [VisitIntenentsEnum.CONSULTATION]: Department.OUTPATIENT_CLINIC,
  [VisitIntenentsEnum.EXAMINATION]: Department.TRIAGE,
  [VisitIntenentsEnum.LAB]: Department.MAIN_LABORATORY,
  [VisitIntenentsEnum.RADIOLOGY]: Department.RADIOLOGY,
  [VisitIntenentsEnum.PHARMACY]: Department.MAIN_PHARMACY,
  [VisitIntenentsEnum.SURGERY]: Department.INPATIENT_WARD,
  [VisitIntenentsEnum.POSTOPERATIVE]: Department.INPATIENT_WARD,
  [VisitIntenentsEnum.FOLLOWUP]: Department.OUTPATIENT_CLINIC,
};
