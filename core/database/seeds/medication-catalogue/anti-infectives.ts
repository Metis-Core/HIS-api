import { med, SeedMedication } from './fields';

export const ANTIBIOTICS: SeedMedication[] = [
  med('AMX500C', 'Amoxicillin', '500 mg', 'Capsule', 300, 100, {
    minStock: 300,
  }),
  med('AMX125S', 'Amoxicillin', '125 mg/5 mL', 'Suspension 100 mL', 4000, 10),
  med('AMC625T', 'Amoxicillin/Clavulanic acid', '625 mg', 'Tablet', 1500, 14),
  med(
    'AMC156S',
    'Amoxicillin/Clavulanic acid',
    '156 mg/5 mL',
    'Suspension 100 mL',
    12000,
    10,
  ),
  med('PENV250T', 'Phenoxymethylpenicillin', '250 mg', 'Tablet', 200, 100),
  med('BPEN24I', 'Benzathine penicillin', '2.4 MU', 'Injection vial', 6000, 10),
  med('AMP500I', 'Ampicillin', '500 mg', 'Injection vial', 1500, 50),
  med('CRO1GI', 'Ceftriaxone', '1 g', 'Injection vial', 4000, 10, {
    minStock: 30,
  }),
  med('CXM500T', 'Cefuroxime', '500 mg', 'Tablet', 2500, 10),
  med('CFX200T', 'Cefixime', '200 mg', 'Tablet', 2000, 10),
  med('GEN80I', 'Gentamicin', '80 mg/2 mL', 'Injection ampoule', 1000, 10, {
    minStock: 30,
  }),
  med('CIP500T', 'Ciprofloxacin', '500 mg', 'Tablet', 500, 100),
  med('AZI500T', 'Azithromycin', '500 mg', 'Tablet', 3000, 30),
  med('ERY250T', 'Erythromycin', '250 mg', 'Tablet', 400, 100),
  med('DOX100C', 'Doxycycline', '100 mg', 'Capsule', 300, 100),
  med('MTZ400T', 'Metronidazole', '400 mg', 'Tablet', 150, 100, {
    minStock: 300,
  }),
  med('MTZ200S', 'Metronidazole', '200 mg/5 mL', 'Suspension 100 mL', 4000, 10),
  med('MTZ500I', 'Metronidazole', '500 mg/100 mL', 'Infusion', 3500, 20),
  med('COT480T', 'Co-trimoxazole', '480 mg', 'Tablet', 150, 100, {
    minStock: 300,
  }),
  med(
    'COT240S',
    'Co-trimoxazole',
    '240 mg/5 mL',
    'Suspension 100 mL',
    3500,
    10,
  ),
  med('NIT100C', 'Nitrofurantoin', '100 mg', 'Capsule', 600, 100),
];

export const ANTIFUNGAL_AND_ANTIVIRAL: SeedMedication[] = [
  med('FLU150C', 'Fluconazole', '150 mg', 'Capsule', 2000, 10),
  med('FLU200T', 'Fluconazole', '200 mg', 'Tablet', 2500, 10),
  med(
    'NYS100S',
    'Nystatin',
    '100,000 IU/mL',
    'Oral suspension 30 mL',
    5000,
    10,
  ),
  med('CLO1C', 'Clotrimazole', '1%', 'Cream 20 g', 4000, 10),
  med('CLO500P', 'Clotrimazole', '500 mg', 'Pessary', 3000, 10),
  med('MIC2C', 'Miconazole', '2%', 'Cream 15 g', 4000, 10),
  med('ACV200T', 'Acyclovir', '200 mg', 'Tablet', 400, 100),
  med('ACV5C', 'Acyclovir', '5%', 'Cream 10 g', 6000, 10),
];

export const ANTIMALARIALS: SeedMedication[] = [
  med('AL20T', 'Artemether/Lumefantrine', '20/120 mg', 'Tablet', 700, 24, {
    minStock: 240,
  }),
  med('ARS60I', 'Artesunate', '60 mg', 'Injection vial', 8000, 10, {
    minStock: 30,
  }),
  med(
    'DHP40T',
    'Dihydroartemisinin/Piperaquine',
    '40/320 mg',
    'Tablet',
    2500,
    3,
  ),
  med('QUI300T', 'Quinine', '300 mg', 'Tablet', 600, 100),
  med('QUI600I', 'Quinine', '600 mg/2 mL', 'Injection ampoule', 2500, 10),
  med('SP500T', 'Sulfadoxine/Pyrimethamine', '500/25 mg', 'Tablet', 500, 100),
];

export const ANTIPARASITICS: SeedMedication[] = [
  med('ALB400T', 'Albendazole', '400 mg', 'Tablet', 500, 100),
  med('MBZ100T', 'Mebendazole', '100 mg', 'Tablet', 300, 100),
  med('PZQ600T', 'Praziquantel', '600 mg', 'Tablet', 1500, 100),
  med('IVM3T', 'Ivermectin', '3 mg', 'Tablet', 800, 100),
  med('BNB25L', 'Benzyl benzoate', '25%', 'Lotion 100 mL', 4000, 10),
];

export const ANTI_INFECTIVES: SeedMedication[] = [
  ...ANTIBIOTICS,
  ...ANTIFUNGAL_AND_ANTIVIRAL,
  ...ANTIMALARIALS,
  ...ANTIPARASITICS,
];
