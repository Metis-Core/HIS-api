import { ServiceCode } from 'src/services/service-codes';

export interface SeedService {
  code?: string;
  name: string;
  fee: number;
  description?: string;
}

const FREE = 'Free: Ministry of Health programme';

/** Services billed by the system itself carry a code; a fee of 0 is a free service shown as "Free". */
export const SERVICE_CATALOGUE: SeedService[] = [
  {
    code: ServiceCode.CONSULTATION,
    name: 'Consultation',
    fee: 30000,
    description: 'Charged when a patient is checked in to see a doctor',
  },
  { name: 'Follow-up review', fee: 15000 },
  { name: 'Specialist consultation', fee: 60000 },
  {
    code: ServiceCode.ANTENATAL_VISIT,
    name: 'Antenatal care visit',
    fee: 0,
    description: FREE,
  },
  { name: 'Postnatal care visit', fee: 0, description: FREE },
  {
    code: ServiceCode.IMMUNIZATION,
    name: 'Routine immunization (UNEPI)',
    fee: 0,
    description: 'Free: vaccines are supplied by the Ministry of Health',
  },
  { name: 'Child growth monitoring', fee: 0, description: FREE },
  { name: 'Family planning counselling', fee: 0, description: FREE },
  { name: 'HIV counselling and testing', fee: 0, description: FREE },
  { name: 'Normal delivery', fee: 200000 },
  {
    code: ServiceCode.ADMISSION_FEE,
    name: 'Admission fee',
    fee: 20000,
    description: 'Charged when a patient is admitted to a ward',
  },
  {
    name: 'Ward bed, general (per day)',
    fee: 30000,
    description: 'Add from billing with the number of days as the quantity',
  },
  {
    name: 'Ward bed, private (per day)',
    fee: 80000,
    description: 'Add from billing with the number of days as the quantity',
  },
  { name: 'Injection administration', fee: 5000 },
  { name: 'IV cannulation and drip set-up', fee: 15000 },
  { name: 'Medical report or certificate', fee: 30000 },
];
