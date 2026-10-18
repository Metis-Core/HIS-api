export type VaccineRoute =
  'Oral' | 'Intradermal' | 'Intramuscular' | 'Subcutaneous';

export interface Vaccine {
  name: string;
  /** When it is due, as in the national schedule. */
  schedule: string;
  doses: string[];
  route: VaccineRoute;
  site: string;
  /** A priced service (code) for vaccines outside the free national programme. */
  serviceCode?: string;
}

const BIRTH = 'Birth dose';
const dose = (count: number) =>
  Array.from({ length: count }, (_, i) => `Dose ${i + 1}`);

/** UNEPI routine schedule (Ministry of Health, 2025); free at every facility, so no service code. */
export const NATIONAL_VACCINES: Vaccine[] = [
  {
    name: 'BCG',
    schedule: 'At birth',
    doses: [BIRTH],
    route: 'Intradermal',
    site: 'Right upper arm',
  },
  {
    name: 'Hepatitis B (birth dose)',
    schedule: 'Within 24 hours of birth',
    doses: [BIRTH],
    route: 'Intramuscular',
    site: 'Left thigh',
  },
  {
    name: 'Polio, oral (OPV)',
    schedule: 'Birth, 6, 10 and 14 weeks',
    doses: [BIRTH, ...dose(3)],
    route: 'Oral',
    site: 'Mouth',
  },
  {
    name: 'DPT-HepB-Hib (pentavalent)',
    schedule: '6, 10 and 14 weeks',
    doses: dose(3),
    route: 'Intramuscular',
    site: 'Left thigh',
  },
  {
    name: 'Pneumococcal (PCV)',
    schedule: '6, 10 and 14 weeks',
    doses: dose(3),
    route: 'Intramuscular',
    site: 'Right thigh',
  },
  {
    name: 'Rotavirus',
    schedule: '6 and 10 weeks',
    doses: dose(2),
    route: 'Oral',
    site: 'Mouth',
  },
  {
    name: 'Polio, injectable (IPV)',
    schedule: '14 weeks',
    doses: dose(2),
    route: 'Intramuscular',
    site: 'Right thigh',
  },
  {
    name: 'Malaria (R21)',
    schedule: '6, 7 and 8 months, booster at 18 months',
    doses: [...dose(3), 'Booster'],
    route: 'Intramuscular',
    site: 'Right upper arm',
  },
  {
    name: 'Measles-Rubella (MR)',
    schedule: '9 and 18 months',
    doses: dose(2),
    route: 'Subcutaneous',
    site: 'Left upper arm',
  },
  {
    name: 'Yellow fever',
    schedule: '9 months',
    doses: ['Dose 1'],
    route: 'Subcutaneous',
    site: 'Right upper arm',
  },
  {
    name: 'HPV',
    schedule: 'Girls aged 10 years, two doses 6 months apart',
    doses: dose(2),
    route: 'Intramuscular',
    site: 'Left upper arm',
  },
  {
    name: 'Tetanus-diphtheria (Td)',
    schedule: 'Women of childbearing age, five doses',
    doses: dose(5),
    route: 'Intramuscular',
    site: 'Left upper arm',
  },
];

/** Outside the national programme, so priced like any other service. */
export const PRIVATE_VACCINES: Vaccine[] = [
  {
    name: 'Typhoid conjugate',
    schedule: 'From 6 months, single dose',
    doses: ['Dose 1', 'Booster'],
    route: 'Intramuscular',
    site: 'Left upper arm',
    serviceCode: 'VAC_TYPHOID',
  },
  {
    name: 'Hepatitis B (adult)',
    schedule: '0, 1 and 6 months',
    doses: dose(3),
    route: 'Intramuscular',
    site: 'Left upper arm',
    serviceCode: 'VAC_HEPB_ADULT',
  },
  {
    name: 'Hepatitis A',
    schedule: 'Two doses 6 to 12 months apart',
    doses: dose(2),
    route: 'Intramuscular',
    site: 'Left upper arm',
    serviceCode: 'VAC_HEPA',
  },
  {
    name: 'Influenza',
    schedule: 'Yearly',
    doses: ['Dose 1'],
    route: 'Intramuscular',
    site: 'Left upper arm',
    serviceCode: 'VAC_FLU',
  },
  {
    name: 'Rabies',
    schedule: 'Days 0, 3, 7 and 28 after exposure',
    doses: dose(4),
    route: 'Intramuscular',
    site: 'Left upper arm',
    serviceCode: 'VAC_RABIES',
  },
  {
    name: 'Meningococcal ACWY',
    schedule: 'Single dose, before travel',
    doses: ['Dose 1'],
    route: 'Intramuscular',
    site: 'Left upper arm',
    serviceCode: 'VAC_MENACWY',
  },
  {
    name: 'Varicella (chickenpox)',
    schedule: 'Two doses 4 to 8 weeks apart',
    doses: dose(2),
    route: 'Subcutaneous',
    site: 'Left upper arm',
    serviceCode: 'VAC_VARICELLA',
  },
];

export const VACCINES: Vaccine[] = [...NATIONAL_VACCINES, ...PRIVATE_VACCINES];

export const findVaccine = (name: unknown): Vaccine | undefined =>
  VACCINES.find((vaccine) => vaccine.name === name);
